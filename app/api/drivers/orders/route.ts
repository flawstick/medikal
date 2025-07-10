import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";

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

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");

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

    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const carParam = searchParams.get("car");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    // If pagination params provided (or no date), return paginated list of all orders for this driver
    if (!dateParam && (pageParam !== null || limitParam !== null)) {
      const page = parseInt(pageParam || "1", 10);
      const limit = parseInt(limitParam || "20", 10);
      if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: "Invalid pagination parameters" },
          { status: 400 },
        );
      }
      // Calculate range for Supabase
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      // Fetch paginated missions and total count
      const query = db
        .from("missions")
        .select("*", { count: "exact" })
        .eq("driver_id", payload.driverId)
        .order("created_at", { ascending: false })
        .range(from, to);
      const { data: missions, count, error: missionsError } = await query;
      if (missionsError) {
        console.error("Supabase error:", missionsError);
        return NextResponse.json(
          { error: "Failed to fetch missions" },
          { status: 500 },
        );
      }
      const total = count ?? 0;
      const totalPages = Math.ceil(total / limit);
      return NextResponse.json({
        data: missions,
        pagination: { page, limit, total, totalPages },
      });
    }

    // If we reach here, we expect a date parameter
    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required (YYYY-MM-DD format)" },
        { status: 400 },
      );
    }
    // Parse and validate date
    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // Set start and end of day for the requested date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build query for missions based on car filter
    let query = db
      .from("missions")
      .select("*")
      .eq("driver_id", payload.driverId)
      .gte("date_expected", startOfDay.toISOString())
      .lte("date_expected", endOfDay.toISOString());

    // Apply car filter if provided
    if (carParam) {
      // Filter by specific car OR missions without assigned car
      query = query.or(`car_id.eq.${carParam},car_id.is.null`);
    }

    const { data: driverMissions, error: missionsError } = await query.order(
      "date_expected",
      { ascending: true },
    );

    if (missionsError) {
      console.error("Supabase error:", missionsError);
      return NextResponse.json(
        { error: "Failed to fetch missions" },
        { status: 500 },
      );
    }

    // Create a formatted address for each mission.
    const missionsWithAddress = (driverMissions || []).map((mission) => ({
      ...mission,
      formatted_address: mission.address
        ? `${mission.address.address}, ${mission.address.city} ${mission.address.zip_code}`
        : null,
    }));

    return NextResponse.json({
      date: dateParam,
      driver: {
        id: payload.driverId,
        name: payload.name,
        username: payload.username,
      },
      missions: missionsWithAddress,
      count: missionsWithAddress.length,
    });
  } catch (error) {
    console.error("Driver orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
