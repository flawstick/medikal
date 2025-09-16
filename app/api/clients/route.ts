import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);

    // First get all clients with filtering, then we'll add mission counts
    let clientsQuery = db
      .from("clients")
      .select("*")
      .eq("is_active", true);

    if (query) {
      clientsQuery = clientsQuery.ilike("name", `%${query}%`);
    }

    const { data: allClients, error: clientsError } = await clientsQuery;

    if (clientsError) {
      console.error("Supabase error:", clientsError);
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      );
    }

    // Get mission counts for all clients
    const { data: missions, error: missionsError } = await db
      .from("missions")
      .select("client_id");

    if (missionsError) {
      console.error("Missions error:", missionsError);
    }

    // Count missions per client
    const missionCounts = missions?.reduce((acc, mission) => {
      if (mission.client_id) {
        acc[mission.client_id] = (acc[mission.client_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Add mission counts to clients and sort
    const clientsWithCounts = allClients?.map(client => ({
      ...client,
      mission_count: missionCounts[client.id] || 0
    })).sort((a, b) => {
      // Sort by mission count descending, then by name ascending
      if (b.mission_count !== a.mission_count) {
        return b.mission_count - a.mission_count;
      }
      return a.name.localeCompare(b.name);
    }) || [];

    // Apply pagination to sorted results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClients = clientsWithCounts.slice(startIndex, endIndex);

    const count = clientsWithCounts.length;

    return NextResponse.json({
      data: paginatedClients,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: page * limit < (count || 0)
      }
    });
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, address, contact_person, notes, is_active } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // Check if client already exists
    const { data: existingClient } = await db
      .from("clients")
      .select("*")
      .eq("name", name)
      .single();

    if (existingClient) {
      return NextResponse.json(existingClient);
    }

    // Create new client
    const { data: newClient, error } = await db
      .from("clients")
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        contact_person: contact_person || null,
        notes: notes || null,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create client" },
        { status: 500 }
      );
    }

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}