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
    const car = searchParams.get("car");
    const driver = searchParams.get("driver");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search");
    const certificate = searchParams.get("certificate");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Start building the query
    let query = db.from("missions").select("*", { count: 'exact' });

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (type && type !== "all") {
      query = query.eq("type", type);
    }
    if (car && car !== "all") {
      if (car === "unassigned") {
        query = query.is("car_id", null);
      } else {
        query = query.eq("car_id", parseInt(car));
      }
    }
    if (driver && driver !== "all") {
      if (driver === "unassigned") {
        query = query.is("driver_id", null);
      } else {
        query = query.eq("driver_id", parseInt(driver));
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `driver.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,car_number.ilike.%${searchTerm}%,address->>address.ilike.%${searchTerm}%,address->>city.ilike.%${searchTerm}%`
      );
    }

    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
        // Filter by created_at date >= dateFrom (start of day)
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte("created_at", fromDate.toISOString());
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
        // Filter by created_at date <= dateTo (end of day)
        toDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", toDate.toISOString());
      }
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
      case "time_delivered":
        query = query.order("time_delivered", { ascending });
        break;
      case "id":
        query = query.order("id", { ascending });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: missions, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch missions" } as APIResponse,
        { status: 500 },
      );
    }

    // Apply certificate filtering in JavaScript if needed
    let filteredMissions = missions;
    if (certificate && certificate.trim()) {
      const certTerm = certificate.trim();

      filteredMissions = missions?.filter((mission: any) => {
        let certificates = mission.certificates;

        // Handle case where certificates might be stored as JSON string
        if (typeof certificates === 'string') {
          try {
            certificates = JSON.parse(certificates);
          } catch (e) {
            return false;
          }
        }

        if (!certificates || !Array.isArray(certificates)) {
          return false;
        }

        // Check if any certificate in the array matches
        return certificates.some((cert: any) =>
          cert?.certificate_number && cert.certificate_number.toString().includes(certTerm)
        );
      }) || [];
    }

    // Return paginated response with metadata
    // For certificate filtering, we need to recalculate pagination
    const totalCount = certificate && certificate.trim() ? filteredMissions.length : (count || 0);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMissions = certificate && certificate.trim()
      ? filteredMissions.slice(startIndex, endIndex)
      : filteredMissions;

    return NextResponse.json({
      data: paginatedMissions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching missions:", error);
    return NextResponse.json(
      { error: "Failed to fetch missions" },
      { status: 500 }
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
      driver_id,
      car_id,
      date_expected,
      certificates,
      metadata,
    } = body

    const { data, error } = await db
      .from("missions")
      .insert({
        type: type || null,
        subtype: subtype || null,
        address,
        driver: driver || null,
        car_number: car_number || null,
        driver_id: driver_id || null,
        car_id: car_id || null,
        date_expected: date_expected ? new Date(date_expected).toISOString() : null,
        certificates: certificates || null,
        metadata: metadata || null,
        status: "unassigned",
      })
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