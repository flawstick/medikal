import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const { data: client, error } = await db
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, phone, email, address, contact_person, notes, is_active } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const { data: updatedClient, error } = await db
      .from("clients")
      .update({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        contact_person: contact_person || null,
        notes: notes || null,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update client" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Failed to update client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    // Check if client has missions
    const { count } = await db
      .from("missions")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (count && count > 0) {
      // Don't delete, just deactivate
      const { data: deactivatedClient, error } = await db
        .from("clients")
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", clientId)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to deactivate client" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Client deactivated due to existing missions",
        client: deactivatedClient
      });
    } else {
      // Safe to delete
      const { error } = await db
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to delete client" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Client deleted successfully"
      });
    }
  } catch (error) {
    console.error("Failed to delete client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}