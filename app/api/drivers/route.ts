import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Start building the query
    let query = db.from("drivers").select("*");
    
    // Apply status filter if provided
    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }
    
    // Apply sorting
    const ascending = sortOrder === "asc";
    
    // Handle different sort options
    switch (sortBy) {
      case "name":
        query = query.order("name", { ascending });
        break;
      case "created_at":
        query = query.order("created_at", { ascending });
        break;
      case "updated_at":
        query = query.order("updated_at", { ascending });
        break;
      case "id":
        query = query.order("id", { ascending });
        break;
      default:
        query = query.order("created_at", { ascending: false }); // Default to newest first
    }

    const { data: drivers, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch drivers" },
        { status: 500 },
      );
    }

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      license_number,
      metadata,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    const { data, error } = await db
      .from("drivers")
      .insert([
        {
          name: name.trim(),
          phone: phone || null,
          email: email || null,
          license_number: license_number || null,
          is_active: true,
          metadata: metadata || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create driver" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 },
    );
  }
}