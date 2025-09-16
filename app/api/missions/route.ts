import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let missionsQuery = db.from("missions").select("*", { count: "exact" });

    if (clientId) {
      missionsQuery = missionsQuery.eq("client_id", parseInt(clientId));
    }

    if (status && status !== "all") {
      missionsQuery = missionsQuery.eq("status", status);
    }

    missionsQuery = missionsQuery.order("created_at", { ascending: false });

    if (limit > 0) {
      missionsQuery = missionsQuery.range(offset, offset + limit - 1);
    }

    const { data: missions, error, count } = await missionsQuery;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch missions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: missions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    });
  } catch (error) {
    console.error("Failed to fetch missions:", error);
    return NextResponse.json(
      { error: "Failed to fetch missions" },
      { status: 500 }
    );
  }
}