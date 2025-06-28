import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";

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
    const {
      driver_id = payload.driverId,
      car_id,
      type = "general",
      formCompletionDate,
      identifierName,
      incidentDate,
      incidentTime,
      incidentDescription,
      vehicleNumber,
      driverAtTime,
      employeeInvolved,
      identifierSignature,
      crash_data = null,
      metadata = null,
    } = body;

    const { data, error } = await supabase
      .from("emergency_reports")
      .insert({
        driver_id,
        car_id,
        type,
        form_completion_date: formCompletionDate,
        identifier_name: identifierName,
        incident_date: incidentDate,
        incident_time: incidentTime,
        incident_description: incidentDescription,
        vehicle_number: vehicleNumber,
        driver_at_time: driverAtTime,
        employee_involved: employeeInvolved,
        identifier_signature: identifierSignature,
        crash_data,
        metadata,
      })
      .select();

    if (error) {
      console.error("Error inserting emergency report:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
