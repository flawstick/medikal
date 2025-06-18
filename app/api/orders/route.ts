import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Function to generate random customer ID
function generateCustomerId(): string {
  const randomNum = Math.floor(Math.random() * 999999 + 1);
  return `CUST-${randomNum.toString().padStart(6, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Start building the query
    let query = db.from("orders").select("*");
    
    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.eq("status", status);
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
      case "time_delivered":
        query = query.order("time_delivered", { ascending, nullsFirst: !ascending });
        break;
      case "id":
        query = query.order("id", { ascending });
        break;
      default:
        query = query.order("created_at", { ascending: false }); // Default to newest first
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 },
      );
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      client_name,
      client_phone,
      address,
      packages_count,
      driver,
      car_number,
      metadata,
    } = body;

    // Validate required fields
    if (!client_name || !address || !packages_count) {
      return NextResponse.json(
        { error: "Client name, address and packages count are required" },
        { status: 400 },
      );
    }

    // Determine status based on assignment
    const status = driver && car_number ? "waiting" : "unassigned";

    const { data, error } = await db
      .from("orders")
      .insert([
        {
          customer_id: customer_id || generateCustomerId(),
          client_name,
          client_phone: client_phone || null,
          address,
          packages_count,
          driver: driver || null,
          car_number: car_number || null,
          status,
          metadata: metadata || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}