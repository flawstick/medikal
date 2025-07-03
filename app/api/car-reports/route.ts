import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "inspection_date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from("vehicle_inspections")
      .select("*", { count: "exact" });

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `vehicle_number.ilike.%${searchTerm}%,driver_name.ilike.%${searchTerm}%`,
      );
    }

    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      console.error("Error fetching vehicle inspections:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching vehicle inspections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
