import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
import { VehicleInspection } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

interface JWTPayload {
  driverId: number;
  username: string;
  name: string;
  phone: string;
  email: string;
  is_active: boolean;
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }
    // Ensure driver account is active
    if (!payload.is_active) {
      return NextResponse.json(
        { error: "Driver account is deactivated" },
        { status: 403 },
      );
    }

    const body: VehicleInspection = await req.json();

    // Basic validation
    if (!body.vehicleNumber || !body.driverSignature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("vehicle_inspections")
      .insert({
        driver_id: payload.driverId,
        car_id: body.carId,
        vehicle_number: body.vehicleNumber,
        registration_number: body.registrationNumber,
        driver_name: body.driverName,
        inspection_date: body.inspectionDate,
        inspection_time: body.inspectionTime,
        odometer_reading: body.odometerReading,
        engine_oil: body.engineOil,
        coolant_water: body.coolantWater,
        windshield_washer_fluid: body.windshieldWasherFluid,
        battery: body.battery,
        five_l_backup_fuses: body.fiveLBackupFuses,
        tire_tool_kit: body.tireToolKit,
        spare_tire: body.spareTire,
        spare_tire_tool_kit: body.spareTireToolKit,
        reflective_vest_50_percent: body.reflectiveVest50Percent,
        reflective_triangle_50_percent: body.reflectiveTriangle50Percent,
        first_aid_kit: body.firstAidKit,
        fire_extinguisher: body.fireExtinguisher,
        jack: body.jack,
        tire_iron: body.tireIron,
        spare_wheel: body.spareWheel,
        spare_wheel_mounting_kit: body.spareWheelMountingKit,
        safety_vest_qty_1: body.safetyVestQty1,
        safety_vest_qty_2: body.safetyVestQty2,
        safety_vest_qty_3: body.safetyVestQty3,
        safety_vest_qty_4: body.safetyVestQty4,
        safety_vest_qty_5: body.safetyVestQty5,
        towing_hook_qty_1: body.towingHookQty1,
        towing_hook_qty_2: body.towingHookQty2,
        jumper_cables_qty_2: body.jumperCablesQty2,
        wheel_chocks_qty_2: body.wheelChocksQty2,
        cellphone_charger_qty_1: body.cellphoneChargerQty1,
        paint_and_body: body.paintAndBody,
        spare_keys: body.spareKeys,
        vehicle_damage_diagram: body.vehicleDamageDiagram,
        notes: body.notes,
        events_obligating_reporting: body.eventsObligatingReporting,
        driver_signature: body.driverSignature,
        metadata: body.metadata,
      })
      .select();

    if (error) {
      console.error("Error creating vehicle inspection:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle inspection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
