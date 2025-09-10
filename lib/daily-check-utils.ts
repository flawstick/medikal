import { supabase } from './supabase';

export interface DailyCheckStatus {
  hasCompletedTodaysCheck: boolean;
  latestCheck: {
    id: string;
    completedAt: string;
    vehicleNumber: string | null;
    status: 'good' | 'bad' | null;
  } | null;
  checkDate: string;
}

/**
 * Check if a driver has completed their daily car inspection
 * @param driverId - The driver's ID
 * @param targetDate - Optional date to check (defaults to today)
 * @returns Promise with daily check status
 */
export async function checkDriverDailyStatus(
  driverId: number, 
  targetDate?: Date
): Promise<DailyCheckStatus> {
  const checkDate = targetDate || new Date();
  const startOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  const endOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() + 1);

  const { data: todaysCheck, error } = await supabase
    .from("vehicle_inspections")
    .select("id, created_at, metadata")
    .eq("driver_id", driverId)
    .gte("created_at", startOfDay.toISOString())
    .lt("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to check daily status: ${error.message}`);
  }

  const hasCompletedToday = todaysCheck && todaysCheck.length > 0;
  const latestCheck = hasCompletedToday ? todaysCheck[0] : null;

  return {
    hasCompletedTodaysCheck: hasCompletedToday,
    latestCheck: latestCheck ? {
      id: latestCheck.id,
      completedAt: latestCheck.created_at,
      vehicleNumber: latestCheck.metadata?.vehicleNumber || null,
      status: latestCheck.metadata?.status || null
    } : null,
    checkDate: checkDate.toISOString().split('T')[0]
  };
}

/**
 * Check multiple drivers' daily status at once
 * @param driverIds - Array of driver IDs
 * @param targetDate - Optional date to check (defaults to today)
 * @returns Promise with array of driver statuses
 */
export async function checkMultipleDriversStatus(
  driverIds: number[], 
  targetDate?: Date
): Promise<(DailyCheckStatus & { driverId: number })[]> {
  const results = await Promise.allSettled(
    driverIds.map(async (driverId) => {
      const status = await checkDriverDailyStatus(driverId, targetDate);
      return { ...status, driverId };
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<DailyCheckStatus & { driverId: number }> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
 * Get drivers who haven't completed today's check
 * @param targetDate - Optional date to check (defaults to today)
 * @returns Promise with array of driver IDs who need to complete checks
 */
export async function getDriversNeedingDailyCheck(targetDate?: Date): Promise<number[]> {
  const checkDate = targetDate || new Date();
  const startOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  const endOfDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() + 1);

  // Get all active drivers
  const { data: allDrivers, error: driversError } = await supabase
    .from("drivers")
    .select("id")
    .eq("is_active", true);

  if (driversError) {
    throw new Error(`Failed to fetch drivers: ${driversError.message}`);
  }

  // Get drivers who have already completed today's check
  const { data: completedChecks, error: checksError } = await supabase
    .from("vehicle_inspections")
    .select("driver_id")
    .gte("created_at", startOfDay.toISOString())
    .lt("created_at", endOfDay.toISOString());

  if (checksError) {
    throw new Error(`Failed to fetch completed checks: ${checksError.message}`);
  }

  const completedDriverIds = new Set(completedChecks?.map(check => check.driver_id) || []);
  const allDriverIds = allDrivers?.map(driver => driver.id) || [];

  return allDriverIds.filter(driverId => !completedDriverIds.has(driverId));
}