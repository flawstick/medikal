import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Find driver by username
    const { data: driver, error: driverError } = await db
      .from("drivers")
      .select("*")
      .eq("username", username)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const driverData = driver;

    // Verify password
    const isValidPassword = await bcryptjs.compare(
      password,
      driverData.hashed_password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check if driver is active
    if (!driverData.is_active) {
      return NextResponse.json(
        { error: "Driver account is deactivated" },
        { status: 403 },
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        driverId: driverData.id,
        username: driverData.username,
        name: driverData.name,
        phone: driverData.phone,
        email: driverData.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return NextResponse.json({
      message: "Authentication successful",
      token,
      driver: {
        id: driverData.id,
        name: driverData.name,
        username: driverData.username,
        phone: driverData.phone,
        email: driverData.email,
      },
    });
  } catch (error) {
    console.error("Driver authentication error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
