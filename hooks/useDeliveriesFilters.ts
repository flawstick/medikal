import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import type { Car, Driver } from "@/lib/types";

export interface DeliveriesFilters {
  statusFilter: string;
  carFilter: string;
  driverFilter: string;
  sortBy: string;
  sortOrder: string;
  searchQuery: string;
  certificateQuery: string;
  dateRange: DateRange | undefined;
  currentPage: number;
}

export interface DeliveriesFiltersActions {
  updateParam: (key: string, value?: string) => void;
  updatePage: (page: number) => void;
  updateDateRange: (range: DateRange | undefined) => void;
  clearFilters: () => void;
  setDateRange: (range: DateRange | undefined) => void;
  setCertificateInput: (value: string) => void;
}

export function useDeliveriesFilters(): {
  filters: DeliveriesFilters;
  actions: DeliveriesFiltersActions;
  cars: Car[];
  drivers: Driver[];
  certificateInput: string;
} {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract filters from URL params
  const statusFilter = searchParams.get("status") ?? "all";
  const carFilter = searchParams.get("car") ?? "all";
  const driverFilter = searchParams.get("driver") ?? "all";
  const sortBy = searchParams.get("sortBy") ?? "created_at";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const searchQuery = searchParams.get("search") ?? "";
  const certificateQuery = searchParams.get("certificate") ?? "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const fromParam = searchParams.get("dateFrom");
  const toParam = searchParams.get("dateTo");

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    fromParam || toParam ? {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined,
    } : undefined
  );

  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [certificateInput, setCertificateInput] = useState(searchParams.get("certificate") || "");

  // Update dateRange and certificateInput state when URL parameters change
  useEffect(() => {
    const newDateRange = fromParam || toParam ? {
      from: fromParam ? new Date(fromParam) : undefined,
      to: toParam ? new Date(toParam) : undefined,
    } : undefined;
    setDateRange(newDateRange);
    setCertificateInput(searchParams.get("certificate") || "");
  }, [fromParam, toParam, searchParams]);

  // Helper to update individual search params in URL
  const updateParam = useCallback((key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset page when changing filters
    if (key !== "page") {
      params.delete("page");
    }
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  }, [searchParams, router]);

  // Helper to update page parameter
  const updatePage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  }, [searchParams, router]);

  // Helper to update date range in URL and state
  const updateDateRange = useCallback((range: DateRange | undefined) => {
    setDateRange(range); // Update state immediately
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) {
      params.set("dateFrom", range.from.toISOString());
    } else {
      params.delete("dateFrom");
    }
    if (range?.to) {
      params.set("dateTo", range.to.toISOString());
    } else {
      params.delete("dateTo");
    }
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  }, [searchParams, router]);

  // Clear all filters (status, car, driver, search, certificate, date range)
  const clearFilters = useCallback(() => {
    setCertificateInput(""); // Clear certificate input
    const params = new URLSearchParams(searchParams.toString());
    ["status", "car", "driver", "search", "certificate", "dateFrom", "dateTo"].forEach((key) => {
      params.delete(key);
    });
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  }, [searchParams, router]);

  // Fetch cars and drivers for filter options
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [carsResponse, driversResponse] = await Promise.all([
          fetch("/api/cars?status=active"),
          fetch("/api/drivers?status=active"),
        ]);

        if (carsResponse.ok) {
          const carsData = await carsResponse.json();
          setCars(carsData);
        }

        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(driversData);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    fetchFiltersData();
  }, []);

  const filters: DeliveriesFilters = {
    statusFilter,
    carFilter,
    driverFilter,
    sortBy,
    sortOrder,
    searchQuery,
    certificateQuery,
    dateRange,
    currentPage,
  };

  const actions: DeliveriesFiltersActions = {
    updateParam,
    updatePage,
    updateDateRange,
    clearFilters,
    setDateRange,
    setCertificateInput,
  };

  return {
    filters,
    actions,
    cars,
    drivers,
    certificateInput,
  };
}