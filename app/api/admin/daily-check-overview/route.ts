import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkMultipleDriversStatus, getDriversNeedingDailyCheck } from "@/lib/daily-check-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Get all active drivers
    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select("id, name, username, is_active")
      .eq("is_active", true)
      .order("name");

    if (driversError) {
      console.error("Error fetching drivers:", driversError);
      return NextResponse.json(
        { error: "Failed to fetch drivers" },
        { status: 500 },
      );
    }

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({
        checkDate: targetDate.toISOString().split('T')[0],
        totalDrivers: 0,
        completedChecks: 0,
        pendingChecks: 0,
        drivers: []
      });
    }

    // Get daily check status for all drivers
    const driverIds = drivers.map(driver => driver.id);
    const [driverStatuses, driversNeedingCheck] = await Promise.all([
      checkMultipleDriversStatus(driverIds, targetDate),
      getDriversNeedingDailyCheck(targetDate)
    ]);

    // Combine driver info with their daily check status
    const driversWithStatus = drivers.map(driver => {
      const status = driverStatuses.find(s => s.driverId === driver.id);
      const needsCheck = driversNeedingCheck.includes(driver.id);
      
      return {
        id: driver.id,
        name: driver.name,
        username: driver.username,
        hasCompletedCheck: status?.hasCompletedTodaysCheck || false,
        needsCheck,
        latestCheck: status?.latestCheck || null,
        checkStatus: status?.latestCheck?.status || null
      };
    });

    const completedCount = driversWithStatus.filter(d => d.hasCompletedCheck).length;
    const pendingCount = driversWithStatus.filter(d => d.needsCheck).length;

    return NextResponse.json({
      checkDate: targetDate.toISOString().split('T')[0],
      totalDrivers: drivers.length,
      completedChecks: completedCount,
      pendingChecks: pendingCount,
      completionRate: drivers.length > 0 ? Math.round((completedCount / drivers.length) * 100) : 0,
      drivers: driversWithStatus
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching daily check overview:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}