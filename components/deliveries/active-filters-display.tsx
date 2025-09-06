"use client";

import type { Car, Driver } from "@/lib/types";

interface ActiveFiltersDisplayProps {
  statusFilter: string;
  carFilter: string;
  driverFilter: string;
  searchQuery: string;
  certificateQuery: string;
  cars: Car[];
  drivers: Driver[];
}

export function ActiveFiltersDisplay({
  statusFilter,
  carFilter,
  driverFilter,
  searchQuery,
  certificateQuery,
  cars,
  drivers,
}: ActiveFiltersDisplayProps) {
  const hasActiveFilters =
    statusFilter !== "all" ||
    carFilter !== "all" ||
    driverFilter !== "all" ||
    searchQuery ||
    certificateQuery;

  if (!hasActiveFilters) {
    return null;
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "unassigned":
        return "ללא הקצאה";
      case "waiting":
        return "ממתין";
      case "in_progress":
        return "בדרך";
      case "completed":
        return "הושלם";
      case "problem":
        return "בעיה";
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
      <span>מסננים פעילים:</span>
      {statusFilter !== "all" && (
        <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
          סטטוס: {getStatusDisplayName(statusFilter)}
        </span>
      )}
      {carFilter !== "all" && (
        <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
          רכב:{" "}
          {cars.find((c) => c.id.toString() === carFilter)?.plate_number ||
            carFilter}
        </span>
      )}
      {driverFilter !== "all" && (
        <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
          נהג:{" "}
          {drivers.find((d) => d.id.toString() === driverFilter)?.name ||
            driverFilter}
        </span>
      )}
      {searchQuery && (
        <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
          חיפוש: "{searchQuery}"
        </span>
      )}
      {certificateQuery && (
        <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
          תעודה: "{certificateQuery}"
        </span>
      )}
    </div>
  );
}