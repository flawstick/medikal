import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";
import type { Mission, APIResponse } from "@/lib/types";

// The secret for signing/verifying JWTs
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Payload shape expected in JWT
interface JWTPayload {
  driverId: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  is_active: boolean;
}

// Verify the JWT and return payload or null
function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// POST /api/drivers/orders/[id]/fail
// Allows a driver to mark a mission as failed/problematic, providing a reason and report details
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<Mission | APIResponse>> {
  try {
    // Authenticate via Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);
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

    // Parse mission ID from route
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
    // Ensure this mission is assigned to the driver
    if (existing.driver_id !== payload.driverId) {
      return NextResponse.json(
        { error: "Not authorized to modify this mission" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      car_id,
      failure_images, // New field for failure images
      failure_location, // New field for failure location
      reason,
      reported,
      reported_to,
    }: {
      car_id: number;
      failure_images?: string[]; // New field for failure images
      failure_location?: { lat: number; lng: number }; // New field for failure location
      reason: string;
      reported?: boolean;
      reported_to?: string;
    } = body;
    // Validate required fields
    if (typeof car_id !== "number" || isNaN(car_id)) {
      return NextResponse.json(
        { error: "car_id is required and must be a number" },
        { status: 400 },
      );
    }
    if (typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 },
      );
    }

    // Merge into metadata
    const prevMeta = (existing.metadata as Record<string, any>) || {};
    const newMeta = {
      ...prevMeta,
      failure_images: failure_images ?? [], // New field for failure images
      failure_location: failure_location ?? null, // New field for failure location
      failure_reason: reason,
      reported: !!reported,
      reported_to: reported_to || prevMeta.reported_to || null,
      date_failed: new Date().toISOString(),
    };

    // Update mission status to 'problem'
    const { data: updated, error: updateErr } = await db
      .from("missions")
      .update({
        driver_id: payload.driverId,
        car_id,
        status: "problem",
        metadata: newMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", missionId)
      .select()
      .single();
    if (updateErr) {
      console.error("Error marking mission as failed:", updateErr);
      return NextResponse.json(
        { error: "Failed to update mission status" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated as Mission);
  } catch (err) {
    console.error("Error in fail route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
