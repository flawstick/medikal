import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// DELETE /api/orders/[id] - Delete a specific order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete order" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const { data: order, error } = await db
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update a specific order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      customer_id,
      client_name,
      client_phone,
      address,
      packages_count,
      driver,
      car_number,
      status,
      metadata,
      time_delivered,
    } = body;

    const { data: updatedOrder, error } = await db
      .from("orders")
      .update({
        customer_id,
        client_name: client_name || null,
        client_phone: client_phone || null,
        address,
        packages_count,
        driver: driver || null,
        car_number: car_number || null,
        status,
        metadata: metadata || null,
        time_delivered: time_delivered ? new Date(time_delivered).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}