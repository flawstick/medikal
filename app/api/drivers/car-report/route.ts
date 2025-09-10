import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
import { calculateReportStatus } from "@/lib/car-report-utils";

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
  } catch (error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
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

    const body = await req.json();

    // Basic validation - now metadata should contain all inspection data
    if (!body.metadata) {
      return NextResponse.json(
        { error: "Missing metadata field" },
        { status: 400 },
      );
    }

    // Validate signature is present and is base64 encoded
    if (!body.metadata.signature) {
      return NextResponse.json(
        { error: "Missing signature in metadata" },
        { status: 400 },
      );
    }

    // Basic validation for base64 data URL format (data:image/png;base64,...)
    if (
      !body.metadata.signature.startsWith("data:image/") ||
      !body.metadata.signature.includes("base64,")
    ) {
      return NextResponse.json(
        { error: "Invalid signature format - must be base64 encoded image" },
        { status: 400 },
      );
    }

    // Calculate status based on inspection results
    const status = calculateReportStatus(body.metadata);
    
    // Add status to metadata
    const metadataWithStatus = {
      ...body.metadata,
      status: status
    };

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .insert({
        driver_id: payload.driverId,
        car_id: body.car_id || null,
        metadata: metadataWithStatus,
      })
      .select();

    if (error) {
      console.error("Error creating vehicle inspection:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
