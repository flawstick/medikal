import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 credentials (S3-compatible)
const {
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_S3_API,
} = process.env;

if (
  !CLOUDFLARE_R2_ACCESS_KEY_ID ||
  !CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
  !CLOUDFLARE_R2_S3_API
) {
  console.warn(
    "Missing R2 credentials: ensure CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_S3_API are set",
  );
}

// Parse bucket name and endpoint
const r2Url = CLOUDFLARE_R2_S3_API ? new URL(CLOUDFLARE_R2_S3_API) : null;
const BUCKET = r2Url ? r2Url.pathname.replace(/^\//, "") : undefined;
const ENDPOINT = r2Url ? `${r2Url.protocol}//${r2Url.host}` : undefined;

// Initialize S3 client for R2
const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

// POST returns a presigned PUT URL and the object key (requires valid JWT)
export async function POST(request: NextRequest) {
  // Validate JWT from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authorization token required" },
      { status: 401 },
    );
  }
  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || "";
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }
  try {
    const { filename, contentType } = await request.json();
    if (!filename || !BUCKET) {
      return NextResponse.json(
        { error: "filename is required and R2 must be configured" },
        { status: 400 },
      );
    }

    // Generate a unique key (e.g., uploads/timestamp-filename)
    const key = `uploads/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });
    // URL expires in 15 minutes
    const url = await getSignedUrl(s3, command, { expiresIn: 900 });
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("Error generating R2 upload URL:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
