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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    if (!payload.is_active) {
      return NextResponse.json(
        { error: "Driver account is deactivated" },
        { status: 403 },
      );
    }

    // Get today's date in the local timezone (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Check if driver has performed a car inspection today
    const { data: todaysCheck, error } = await supabase
      .from("vehicle_inspections")
      .select("id, created_at, metadata")
      .eq("driver_id", payload.driverId)
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error checking daily car inspection:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const hasCompletedToday = todaysCheck && todaysCheck.length > 0;
    const latestCheck = hasCompletedToday ? todaysCheck[0] : null;

    return NextResponse.json({
      hasCompletedTodaysCheck: hasCompletedToday,
      driverId: payload.driverId,
      driverName: payload.name,
      checkDate: today.toISOString().split('T')[0],
      latestCheck: latestCheck ? {
        id: latestCheck.id,
        completedAt: latestCheck.created_at,
        vehicleNumber: latestCheck.metadata?.vehicleNumber || null,
        status: latestCheck.metadata?.status || null
      } : null
    }, { status: 200 });

  } catch (error) {
    console.error("Error checking daily car inspection status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}