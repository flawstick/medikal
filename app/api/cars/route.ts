import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import type { CreateCarRequest, Car, APIResponse } from "@/lib/types"
import { validateCar } from "@/lib/validation"

export const runtime = "edge";

export async function GET(request: NextRequest): Promise<NextResponse<Car[] | APIResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Start building the query
    let query = db.from("cars").select("*");
    
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
      case "plate_number":
        query = query.order("plate_number", { ascending });
        break;
      case "make":
        query = query.order("make", { ascending });
        break;
      case "model":
        query = query.order("model", { ascending });
        break;
      case "year":
        query = query.order("year", { ascending });
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

    const { data: cars, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch cars" },
        { status: 500 },
      );
    }

    return NextResponse.json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<Car | APIResponse>> {
  try {
    const body: CreateCarRequest = await request.json()
    
    // Validate the request body
    const validation = validateCar(body)
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
      plate_number,
      make,
      model,
      year,
      color,
      metadata,
    } = body

    const { data, error } = await db
      .from("cars")
      .insert([
        {
          plate_number: plate_number.trim(),
          make: make || null,
          model: model || null,
          year: year || null,
          color: color || null,
          is_active: true,
          metadata: metadata || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: "Plate number already exists" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Failed to create car" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating car:", error);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 },
    );
  }
}