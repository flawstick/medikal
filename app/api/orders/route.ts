import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import type { CreateMissionRequest, Mission, APIResponse, PaginatedResponse } from "@/lib/types"
import { validateMission } from "@/lib/validation"

export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<Mission> | APIResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Start building the query
    let query = db.from("missions").select("*");

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply type filter if provided
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Search in multiple fields - driver, type, address
      query = query.or(
        `driver.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,car_number.ilike.%${searchTerm}%,address->>address.ilike.%${searchTerm}%,address->>city.ilike.%${searchTerm}%`
      );
    }

    // Apply sorting
    const ascending = sortOrder === "asc";

    // Handle different sort options
    switch (sortBy) {
      case "created_at":
        query = query.order("created_at", { ascending });
        break;
      case "updated_at":
        query = query.order("updated_at", { ascending });
        break;
      case "completed_at":
        query = query.order("completed_at", { ascending, nullsFirst: !ascending });
        break;
      case "date_expected":
        query = query.order("date_expected", { ascending, nullsFirst: !ascending });
        break;
      case "id":
        query = query.order("id", { ascending });
        break;
      default:
        query = query.order("created_at", { ascending: false }); // Default to newest first
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: missions, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch missions" } as APIResponse,
        { status: 500 },
      );
    }

    // Return paginated response with metadata
    return NextResponse.json({
      data: missions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching missions:", error);
    return NextResponse.json(
      { error: "Failed to fetch missions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<Mission | APIResponse>> {
  try {
    const body: CreateMissionRequest = await request.json()
    
    // Validate the request body
    const validation = validateMission(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.errors.map(e => `${e.field}: ${e.message}`)
        } as APIResponse,
        { status: 400 },
      )
    }

    const {
      type,
      subtype,
      address,
      driver,
      car_number,
      date_expected,
      certificates,
      metadata,
    } = body

    // Normalize address to object format if string provided
    const addressObj = typeof address === 'string' 
      ? { address, city: '', zip_code: '' } 
      : address

    // Determine status based on assignment
    const status = driver && car_number ? "waiting" : "unassigned";

    const { data, error } = await db
      .from("missions")
      .insert([
        {
          type,
          subtype: subtype || null,
          address: addressObj,
          driver: driver || null,
          car_number: car_number || null,
          status,
          date_expected: date_expected ? new Date(date_expected).toISOString() : null,
          certificates: certificates || null,
          metadata: metadata || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create mission" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating mission:", error);
    return NextResponse.json(
      { error: "Failed to create mission" },
      { status: 500 },
    );
  }
}
