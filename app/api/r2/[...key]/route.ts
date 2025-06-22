import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 credentials
const {
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_S3_API,
} = process.env;
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

// DELETE /api/r2/[...key]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    if (!BUCKET) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
    }
    // Reconstruct key path
    const key = params.key.join("/");
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    await s3.send(command);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting R2 object:", err);
    return NextResponse.json({ error: "Failed to delete object" }, { status: 500 });
  }
}