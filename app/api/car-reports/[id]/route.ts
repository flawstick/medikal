import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateReportStatus } from "@/lib/car-report-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching car report:", error);
      return NextResponse.json(
        { error: "Car report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching car report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("vehicle_inspections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting car report:", error);
      return NextResponse.json(
        { error: "Failed to delete car report" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Car report deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting car report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Basic validation - metadata should contain all inspection data
    if (!body.metadata) {
      return NextResponse.json(
        { error: "Missing metadata field" },
        { status: 400 }
      );
    }

    // Calculate status based on inspection results
    const status = calculateReportStatus(body.metadata);
    
    // Add status to metadata
    const metadataWithStatus = {
      ...body.metadata,
      status: status
    };

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .update({
        metadata: metadataWithStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating car report:", error);
      return NextResponse.json(
        { error: "Failed to update car report" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error updating car report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}