import { getSupabaseClient } from "./supabase-client";
import type { Mission } from "./types";

export interface MissionUpdateCallback {
  (missions: Mission[], type: "insert" | "update" | "delete"): void;
}

export interface RealtimeSubscriptionOptions {
  statusFilter?: string;
  typeFilter?: string;
  carFilter?: string;
  driverFilter?: string;
  currentPage?: number;
  itemsPerPage?: number;
  onUpdate?: MissionUpdateCallback;
}

class MissionsRealtimeManager {
  private supabase = getSupabaseClient();
  private activeChannels = new Map<string, any>();
  private callbacks = new Map<string, MissionUpdateCallback>();

  subscribe(channelName: string, options: RealtimeSubscriptionOptions = {}) {
    // Clean up existing channel if it exists
    this.unsubscribe(channelName);

    const {
      statusFilter,
      typeFilter,
      carFilter,
      driverFilter,
      currentPage = 1,
      itemsPerPage = 10,
      onUpdate,
    } = options;

    if (onUpdate) {
      this.callbacks.set(channelName, onUpdate);
    }

    // Build filter for realtime based on current view
    let filter = "";
    const filters: string[] = [];

    if (statusFilter && statusFilter !== "all") {
      filters.push(`status=eq.${statusFilter}`);
    }
    if (typeFilter && typeFilter !== "all") {
      filters.push(`type=eq.${typeFilter}`);
    }
    if (carFilter && carFilter !== "all") {
      if (carFilter === "unassigned") {
        filters.push(`car_id=is.null`);
      } else {
        filters.push(`car_id=eq.${carFilter}`);
      }
    }
    if (driverFilter && driverFilter !== "all") {
      if (driverFilter === "unassigned") {
        filters.push(`driver_id=is.null`);
      } else {
        filters.push(`driver_id=eq.${driverFilter}`);
      }
    }

    // Create subscription with all events
    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "missions",
        },
        async (payload: any) => {
          await this.handleMissionChange(channelName, payload, options);
        },
      )
      .subscribe((status) => {
        console.log(`Realtime subscription ${channelName} status:`, status);
      });

    this.activeChannels.set(channelName, channel);
    return channel;
  }

  private async handleMissionChange(
    channelName: string,
    payload: any,
    options: RealtimeSubscriptionOptions,
  ) {
    const callback = this.callbacks.get(channelName);
    if (!callback) return;

    const { currentPage = 1, itemsPerPage = 10 } = options;

    // Calculate if this change affects the current page
    const mission = payload.new || payload.old;
    if (!mission) return;

    // Check if the mission matches current filters
    if (!this.matchesFilters(mission, options)) return;

    // For paginated views, we need to fetch fresh data to maintain correct pagination
    // This is more efficient than trying to calculate exact position
    try {
      await this.fetchAndNotifyPageData(channelName, options);
    } catch (error) {
      console.error("Error handling realtime mission change:", error);
    }
  }

  private matchesFilters(
    mission: any,
    options: RealtimeSubscriptionOptions,
  ): boolean {
    const { statusFilter, typeFilter, carFilter, driverFilter } = options;

    if (
      statusFilter &&
      statusFilter !== "all" &&
      mission.status !== statusFilter
    ) {
      return false;
    }
    if (typeFilter && typeFilter !== "all" && mission.type !== typeFilter) {
      return false;
    }
    if (carFilter && carFilter !== "all") {
      if (carFilter === "unassigned" && mission.car_id !== null) {
        return false;
      }
      if (
        carFilter !== "unassigned" &&
        mission.car_id !== parseInt(carFilter)
      ) {
        return false;
      }
    }
    if (driverFilter && driverFilter !== "all") {
      if (driverFilter === "unassigned" && mission.driver_id !== null) {
        return false;
      }
      if (
        driverFilter !== "unassigned" &&
        mission.driver_id !== parseInt(driverFilter)
      ) {
        return false;
      }
    }

    return true;
  }

  private async fetchAndNotifyPageData(
    channelName: string,
    options: RealtimeSubscriptionOptions,
  ) {
    const {
      statusFilter = "all",
      typeFilter = "all",
      carFilter = "all",
      driverFilter = "all",
      currentPage = 1,
      itemsPerPage = 10,
    } = options;

    const callback = this.callbacks.get(channelName);
    if (!callback) return;

    // Build API query parameters
    const params = new URLSearchParams({
      status: statusFilter,
      type: typeFilter,
      car: carFilter,
      driver: driverFilter,
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      sortBy: "created_at",
      sortOrder: "desc",
    });

    try {
      const response = await fetch(`/api/orders?${params}`);
      if (response.ok) {
        const result = await response.json();
        const missions = result.data || [];
        callback(missions, "update");
      }
    } catch (error) {
      console.error("Error fetching updated mission data:", error);
    }
  }

  unsubscribe(channelName: string) {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
      this.callbacks.delete(channelName);
    }
  }

  unsubscribeAll() {
    for (const [channelName] of this.activeChannels) {
      this.unsubscribe(channelName);
    }
  }

  updateFilters(channelName: string, options: RealtimeSubscriptionOptions) {
    // Re-subscribe with new filters
    this.subscribe(channelName, options);
  }
}

// Export singleton instance
export const missionsRealtime = new MissionsRealtimeManager();

// Hook for React components
export function useMissionsRealtime() {
  return missionsRealtime;
}
