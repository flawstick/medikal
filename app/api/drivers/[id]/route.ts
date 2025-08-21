import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export const runtime = "edge";

// DELETE /api/drivers/[id] - Delete a specific driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("drivers")
      .delete()
      .eq("id", driverId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete driver" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Driver deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    );
  }
}

// GET /api/drivers/[id] - Get a specific driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const { data: driver, error } = await db
      .from("drivers")
      .select("*")
      .eq("id", driverId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500 }
    );
  }
}

// PUT /api/drivers/[id] - Update a specific driver
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      license_number,
      username,
      is_active,
      metadata,
    } = body;

    const { data: updatedDriver, error } = await db
      .from("drivers")
      .update({
        name: name || null,
        phone: phone || null,
        email: email || null,
        license_number: license_number || null,
        username: username || null,
        is_active: is_active !== undefined ? is_active : true,
        metadata: metadata || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", driverId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update driver" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    );
  }
}