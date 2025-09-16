import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const { keepClientId, mergeClientId } = await request.json();

    if (!keepClientId || !mergeClientId) {
      return NextResponse.json(
        { error: "Both client IDs are required" },
        { status: 400 }
      );
    }

    if (keepClientId === mergeClientId) {
      return NextResponse.json(
        { error: "Cannot merge client with itself" },
        { status: 400 }
      );
    }

    // Get both clients
    const [{ data: keepClient }, { data: mergeClient }] = await Promise.all([
      db.from("clients").select("*").eq("id", keepClientId).single(),
      db.from("clients").select("*").eq("id", mergeClientId).single()
    ]);

    if (!keepClient || !mergeClient) {
      return NextResponse.json(
        { error: "One or both clients not found" },
        { status: 404 }
      );
    }

    // Update all missions from mergeClient to keepClient
    const { error: missionsError } = await db
      .from("missions")
      .update({ client_id: keepClientId })
      .eq("client_id", mergeClientId);

    if (missionsError) {
      console.error("Error updating missions:", missionsError);
      return NextResponse.json(
        { error: "Failed to update missions" },
        { status: 500 }
      );
    }

    // Merge metadata - combine both clients' metadata
    const mergedMetadata = {
      ...keepClient.metadata,
      ...mergeClient.metadata,
      merged_from: {
        client_id: mergeClientId,
        client_name: mergeClient.name,
        merged_at: new Date().toISOString(),
        original_metadata: mergeClient.metadata
      }
    };

    // Update keepClient with merged data
    const { error: updateError } = await db
      .from("clients")
      .update({
        // Keep existing data but fill in missing fields from mergeClient
        phone: keepClient.phone || mergeClient.phone,
        email: keepClient.email || mergeClient.email,
        address: keepClient.address || mergeClient.address,
        contact_person: keepClient.contact_person || mergeClient.contact_person,
        notes: keepClient.notes
          ? (mergeClient.notes ? `${keepClient.notes}\n\nמוזג מ: ${mergeClient.name}\n${mergeClient.notes}` : keepClient.notes)
          : mergeClient.notes,
        metadata: mergedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", keepClientId);

    if (updateError) {
      console.error("Error updating keep client:", updateError);
      return NextResponse.json(
        { error: "Failed to update primary client" },
        { status: 500 }
      );
    }

    // Delete the merged client
    const { error: deleteError } = await db
      .from("clients")
      .delete()
      .eq("id", mergeClientId);

    if (deleteError) {
      console.error("Error deleting merged client:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete merged client" },
        { status: 500 }
      );
    }

    // Get updated client data
    const { data: updatedClient } = await db
      .from("clients")
      .select("*")
      .eq("id", keepClientId)
      .single();

    return NextResponse.json({
      success: true,
      message: `Client "${mergeClient.name}" has been merged into "${keepClient.name}"`,
      client: updatedClient
    });

  } catch (error) {
    console.error("Failed to merge clients:", error);
    return NextResponse.json(
      { error: "Failed to merge clients" },
      { status: 500 }
    );
  }
}