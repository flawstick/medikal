import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Get query parameters (matching orders route pattern exactly)
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);

    // Start building the query
    let query = supabase
      .from("vehicle_inspections")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `metadata->>vehicleNumber.ilike.%${searchTerm}%,metadata->>driverName.ilike.%${searchTerm}%`,
      );
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    switch (sortBy) {
      case "created_at":
        query = query.order("created_at", { ascending });
        break;
      case "updated_at":
        query = query.order("updated_at", { ascending });
        break;
      case "inspection_date":
        query = query.order("metadata->>inspectionDate", { ascending });
        break;
      case "vehicle_number":
        query = query.order("metadata->>vehicleNumber", { ascending });
        break;
      case "driver_name":
        query = query.order("metadata->>driverName", { ascending });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching vehicle inspections:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    // Return paginated response with metadata (matching orders route format exactly)
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching vehicle inspections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
