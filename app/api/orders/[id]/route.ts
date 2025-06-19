import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import type { Mission, APIResponse, CreateMissionRequest } from "@/lib/types"

// DELETE /api/orders/[id] - Delete a specific mission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<APIResponse>> {
  try {
    const { id } = await params;
    const missionId = parseInt(id);

    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "Invalid mission ID" } as APIResponse,
        { status: 400 },
      )
    }

    const { error } = await db
      .from("missions")
      .delete()
      .eq("id", missionId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete mission" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Mission deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting mission:", error);
    return NextResponse.json(
      { error: "Failed to delete mission" },
      { status: 500 },
    );
  }
}

// GET /api/orders/[id] - Get a specific mission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<Mission | APIResponse>> {
  try {
    const { id } = await params;
    const missionId = parseInt(id);

    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "Invalid mission ID" } as APIResponse,
        { status: 400 },
      )
    }

    const { data: mission, error } = await db
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Mission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mission);
  } catch (error) {
    console.error("Error fetching mission:", error);
    return NextResponse.json(
      { error: "Failed to fetch mission" },
      { status: 500 },
    );
  }
}

// PUT /api/orders/[id] - Update a specific mission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<Mission | APIResponse>> {
  try {
    const { id } = await params;
    const missionId = parseInt(id);

    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "Invalid mission ID" } as APIResponse,
        { status: 400 },
      )
    }

    const body: Partial<CreateMissionRequest> & { status?: string; completed_at?: string } = await request.json()
    const {
      type,
      subtype,
      address,
      driver,
      car_number,
      status,
      date_expected,
      completed_at,
      certificates,
      metadata,
    } = body

    // Validate required fields for update
    if (type && !type.trim()) {
      return NextResponse.json(
        { error: "Type cannot be empty" } as APIResponse,
        { status: 400 },
      )
    }

    const { data: updatedMission, error } = await db
      .from("missions")
      .update({
        type,
        subtype: subtype || null,
        address: address ? (typeof address === 'string' ? { address, city: '', zip_code: '' } : address) : undefined,
        driver: driver || null,
        car_number: car_number || null,
        status,
        date_expected: date_expected ? new Date(date_expected).toISOString() : null,
        completed_at: completed_at ? new Date(completed_at).toISOString() : null,
        certificates: certificates || null,
        metadata: metadata || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", missionId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update mission" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMission);
  } catch (error) {
    console.error("Error updating mission:", error);
    return NextResponse.json(
      { error: "Failed to update mission" },
      { status: 500 },
    );
  }
}
