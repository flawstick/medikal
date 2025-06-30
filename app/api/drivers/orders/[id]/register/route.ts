import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";
import type { Mission, APIResponse } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

interface JWTPayload {
  driverId: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  is_active: boolean;
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (_err) {
    return null;
  }
}

// POST /api/drivers/orders/[id]/register
// Driver completes a mission by providing images and marking status = completed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<Mission | APIResponse>> {
  try {
    // Authenticate
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }
    // Ensure driver account is active
    if (!payload.is_active) {
      return NextResponse.json(
        { error: "Driver account is deactivated" },
        { status: 403 },
      );
    }

    // Parse mission ID
    const { id } = await params;
    const missionId = parseInt(id, 10);
    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "Invalid mission ID" },
        { status: 400 },
      );
    }

    // Fetch existing mission
    const { data: existing, error: fetchErr } = await db
      .from("missions")
      .select("*, metadata")
      .eq("id", missionId)
      .single();
    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }
    // Ensure mission belongs to driver
    if (existing.driver_id !== payload.driverId) {
      return NextResponse.json(
        { error: "Not authorized to update this mission" },
        { status: 403 },
      );
    }

    // Parse body: only car_id and image arrays
    const body = await request.json();
    const {
      car_id,
      certificate_images,
      package_images,
      metadata,
    }: {
      car_id: number;
      certificate_images?: string[];
      package_images?: string[];
      metadata?: { location?: any };
    } = body;
    // Validate car_id
    if (typeof car_id !== "number" || isNaN(car_id)) {
      return NextResponse.json(
        { error: "car_id is required and must be a number" },
        { status: 400 },
      );
    }
    // Build metadata update
    const newMetadata = {
      ...((existing.metadata as Record<string, any>) || {}),
      certificate_images: certificate_images || [],
      package_images: package_images || [],
    };

    if (metadata?.location) {
      newMetadata.register_location = metadata.location;
    }

    // Update mission: use driverId from JWT
    const { data: updated, error: updateErr } = await db
      .from("missions")
      .update({
        driver_id: payload.driverId,
        car_id,
        status: "completed",
        completed_at: new Date().toISOString(),
        metadata: newMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", missionId)
      .select()
      .single();
    if (updateErr) {
      console.error("Error updating mission to completed:", updateErr);
      return NextResponse.json(
        { error: "Failed to complete mission" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated as Mission);
  } catch (err) {
    console.error("Error in mission register route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
