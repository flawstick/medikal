import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import bcryptjs from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const driverId = parseInt(params.id);
    if (isNaN(driverId)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword.trim(), 10);

    // Update the driver's password
    const { data, error } = await db
      .from("drivers")
      .update({
        hashed_password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", driverId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}