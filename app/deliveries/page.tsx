"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { DeliveriesTable } from "@/components/deliveries-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Car as CarIcon,
  User,
} from "lucide-react";
import Link from "next/link";
import type { Car, Driver } from "@/lib/types";

export default function DeliveriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") ?? "all";
  const carFilter = searchParams.get("car") ?? "all";
  const driverFilter = searchParams.get("driver") ?? "all";
  const sortBy = searchParams.get("sortBy") ?? "created_at";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const searchQuery = searchParams.get("search") ?? "";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const dateRange: DateRange | undefined = fromParam || toParam ? {
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
  } : undefined;
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Helper to update individual search params in URL
  const updateParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  };

  // Helper to update date range in URL
  const updateDateRange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) {
      params.set("from", range.from.toISOString());
    } else {
      params.delete("from");
    }
    if (range?.to) {
      params.set("to", range.to.toISOString());
    } else {
      params.delete("to");
    }
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  };
  // Clear all filters (status, car, driver, search, date range)
  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["status", "car", "driver", "search", "from", "to"].forEach((key) => {
      params.delete(key);
    });
    const queryString = params.toString();
    router.push(`/deliveries${queryString ? `?${queryString}` : ""}`);
  };

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

  return (
    <div className="space-y-6 h-screen flex flex-col">
      <div className="flex flex-col items-end gap-2 md:flex-row md:justify-between md:items-center">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">משלוחים</h1>
          <p className="text-muted-foreground mt-1">
            ניהול וצפייה בכל המשלוחים
          </p>
        </div>
        <Button
          size="lg"
          asChild
          className="transform transition-transform duration-200 hover:scale-110"
        >
          <Link href="/upload" className="inline-flex items-center gap-2 group">
            <Plus className="h-5 w-5 group-hover:animate-spin" />
            משלוח חדש
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm flex flex-col flex-1">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex flex-row items-center justify-between text-right text-xl w-full">
              <span>כל המשלוחים</span>
              {/* Date Range Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-52">
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "P")} - ${format(
                          dateRange.to,
                          "P",
                        )}`
                      : "טווח תאריכים"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={updateDateRange}
                    numberOfMonths={2}
                    className="rounded-lg border shadow-sm"
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
            {(statusFilter !== "all" ||
              carFilter !== "all" ||
              driverFilter !== "all" ||
              searchQuery) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>מסננים פעילים:</span>
                {statusFilter !== "all" && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                    סטטוס:{" "}
                    {statusFilter === "unassigned"
                      ? "ללא הקצאה"
                      : statusFilter === "waiting"
                        ? "ממתין"
                        : statusFilter === "in_progress"
                          ? "בדרך"
                          : statusFilter === "completed"
                            ? "הושלם"
                            : "בעיה"}
                  </span>
                )}
                {carFilter !== "all" && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                    רכב:{" "}
                    {cars.find((c) => c.id.toString() === carFilter)
                      ?.plate_number || carFilter}
                  </span>
                )}
                {driverFilter !== "all" && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                    נהג:{" "}
                    {drivers.find((d) => d.id.toString() === driverFilter)
                      ?.name || driverFilter}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                    חיפוש: "{searchQuery}"
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xs order-3 md:order-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש משלוחים..."
                className="pr-10 text-right"
                value={searchQuery}
                onChange={(e) => updateParam("search", e.target.value)}
              />
            </div>
            {/* Clear filters button */}
            <Button variant="outline" className="order-2 md:order-3" onClick={clearFilters}>
              נקה מסננים
            </Button>

            {/* Filter and Sort Controls */}
            <div className="flex gap-2 order-1 md:order-2 flex-wrap">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => updateParam("status", value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    כל הסטטוסים
                  </SelectItem>
                  <SelectItem
                    value="unassigned"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    ללא הקצאה
                  </SelectItem>
                  <SelectItem
                    value="waiting"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    ממתין
                  </SelectItem>
                  <SelectItem
                    value="in_progress"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    בדרך
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    הושלם
                  </SelectItem>
                  <SelectItem
                    value="problem"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    בעיה
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Car Filter */}
              <Select value={carFilter} onValueChange={(value) => updateParam("car", value)}>
                <SelectTrigger className="w-40">
                  <CarIcon className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="רכב" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    כל הרכבים
                  </SelectItem>
                  <SelectItem
                    value="unassigned"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    ללא רכב
                  </SelectItem>
                  {cars.map((car) => (
                    <SelectItem
                      key={car.id}
                      value={car.id.toString()}
                      className="hover:bg-transparent hover:text-foreground"
                    >
                      {car.plate_number}
                      {car.make && car.model && ` - ${car.make} ${car.model}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Driver Filter */}
              <Select value={driverFilter} onValueChange={(value) => updateParam("driver", value)}>
                <SelectTrigger className="w-40">
                  <User className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="נהג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    כל הנהגים
                  </SelectItem>
                  <SelectItem
                    value="unassigned"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    ללא נהג
                  </SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem
                      key={driver.id}
                      value={driver.id.toString()}
                      className="hover:bg-transparent hover:text-foreground"
                    >
                      {driver.name}
                      {driver.phone && ` (${driver.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value) => updateParam("sortBy", value)}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="created_at"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    תאריך יצירה
                  </SelectItem>
                  <SelectItem
                    value="updated_at"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    עדכון אחרון
                  </SelectItem>
                  <SelectItem
                    value="time_delivered"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    זמן משלוח
                  </SelectItem>
                  <SelectItem
                    value="id"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    מספר משלוח
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(value) => updateParam("sortOrder", value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="desc"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    חדש לישן
                  </SelectItem>
                  <SelectItem
                    value="asc"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    ישן לחדש
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <DeliveriesTable
            statusFilter={statusFilter}
            carFilter={carFilter}
            driverFilter={driverFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchQuery={searchQuery}
            dateRange={dateRange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
