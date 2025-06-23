import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/server/db";
import type { APIResponse } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

interface JWTPayload {
  driverId: number;
  username: string;
  name: string;
  phone: string;
  email: string;
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// GET /api/drivers/analytics
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" } as APIResponse,
        { status: 401 },
      );
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" } as APIResponse,
        { status: 401 },
      );
    }

    const driverId = payload.driverId;
    // Status categories
    const statuses = ["waiting", "in_progress", "completed", "problem"];
    // Fetch counts per status
    const statusCounts: Record<string, number> = {};
    await Promise.all(
      statuses.map(async (status) => {
        const { count, error } = await db
          .from("missions")
          .select("*", { count: "exact", head: true })
          .eq("driver_id", driverId)
          .eq("status", status as string);
        statusCounts[status] = error ? 0 : (count ?? 0);
      }),
    );

    // Prepare time series for last 7 days (completed missions)
    const today = new Date();
    const days: { date: string; count: number }[] = [];
    // Start from 6 days ago to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const earliest = days[0].date + "T00:00:00Z";
    // Fetch completed missions in range
    const { data: recent, error: recentError } = await db
      .from("missions")
      .select("completed_at")
      .eq("driver_id", driverId)
      .eq("status", "completed")
      .gte("completed_at", earliest);
    if (!recentError && recent) {
      recent.forEach((row) => {
        const ca = row.completed_at;
        if (ca) {
          const dateKey = ca.slice(0, 10);
          const entry = days.find((d) => d.date === dateKey);
          if (entry) entry.count++;
        }
      });
    }

    return NextResponse.json({
      statusCounts,
      dailyCompleted: days,
    });
  } catch (err) {
    console.error("Error fetching driver analytics:", err);
    return NextResponse.json(
      { error: "Internal server error" } as APIResponse,
      { status: 500 },
    );
  }
}
