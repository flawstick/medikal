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
  } catch (_error) {
    return null;
  }
}

// GET /api/drivers/orders/[id] - Fetch a single mission for the authenticated driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<Mission | APIResponse>> {
  try {
    // Authenticate via Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    // Ensure driver account is active
    if (!payload.is_active) {
      return NextResponse.json(
        { error: "Driver account is deactivated" },
        { status: 403 }
      );
    }

    // Extract mission ID from route parameter
    const { id } = await params;
    const missionId = parseInt(id, 10);
    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "Invalid mission ID" },
        { status: 400 }
      );
    }

    // Fetch the mission
    const { data: mission, error } = await db
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();
    if (error || !mission) {
      console.error("Supabase error fetching mission:", error);
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 }
      );
    }

    // Ensure the mission belongs to this driver
    if (mission.driver_id !== payload.driverId) {
      return NextResponse.json(
        { error: "Not authorized to view this mission" },
        { status: 403 }
      );
    }

    return NextResponse.json(mission);
  } catch (err) {
    console.error("Error in driver single order fetch:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}