import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// DELETE /api/cars/[id] - Delete a specific car
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const carId = parseInt(id);

    if (isNaN(carId)) {
      return NextResponse.json(
        { error: "Invalid car ID" },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("cars")
      .delete()
      .eq("id", carId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete car" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Car deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}

// GET /api/cars/[id] - Get a specific car
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const carId = parseInt(id);

    if (isNaN(carId)) {
      return NextResponse.json(
        { error: "Invalid car ID" },
        { status: 400 }
      );
    }

    const { data: car, error } = await db
      .from("cars")
      .select("*")
      .eq("id", carId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error("Error fetching car:", error);
    return NextResponse.json(
      { error: "Failed to fetch car" },
      { status: 500 }
    );
  }
}

// PUT /api/cars/[id] - Update a specific car
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const carId = parseInt(id);

    if (isNaN(carId)) {
      return NextResponse.json(
        { error: "Invalid car ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      plate_number,
      make,
      model,
      year,
      color,
      is_active,
      metadata,
    } = body;

    const { data: updatedCar, error } = await db
      .from("cars")
      .update({
        plate_number: plate_number || null,
        make: make || null,
        model: model || null,
        year: year || null,
        color: color || null,
        is_active: is_active !== undefined ? is_active : true,
        metadata: metadata || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carId)
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
        { error: "Failed to update car" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedCar);
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  }
}