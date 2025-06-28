import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {

    const { id } = params;

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching vehicle inspection with ID ${id}:`, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching vehicle inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
