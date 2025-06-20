import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import type { CreateDriverRequest, Driver, APIResponse } from "@/lib/types"
import { validateDriver } from "@/lib/validation"
import bcryptjs from "bcryptjs"

export async function GET(request: NextRequest): Promise<NextResponse<Driver[] | APIResponse>> {
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

export async function POST(request: NextRequest): Promise<NextResponse<Driver | APIResponse>> {
  try {
    const body: CreateDriverRequest = await request.json()
    
    // Validate the request body
    const validation = validateDriver(body)
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
      name,
      phone,
      email,
      license_number,
      username,
      password,
      metadata,
    } = body

    // Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    const { data, error } = await db
      .from("drivers")
      .insert([
        {
          name: name.trim(),
          phone: phone || null,
          email: email || null,
          license_number: license_number || null,
          username: username.trim(),
          hashed_password: hashedPassword,
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