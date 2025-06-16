import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_name, client_phone, address, packages_count, driver, car_number } = body

    // Validate required fields
    if (!address || !packages_count) {
      return NextResponse.json({ error: "Address and packages count are required" }, { status: 400 })
    }

    // Determine status based on assignment
    const status = driver && car_number ? "waiting" : "unassigned"

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          client_name: client_name || null,
          client_phone: client_phone || null,
          address,
          packages_count,
          driver: driver || null,
          car_number: car_number || null,
          status,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
