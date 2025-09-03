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
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Car, Driver, Mission } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DeliveriesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") ?? "all";
  const carFilter = searchParams.get("car") ?? "all";
  const driverFilter = searchParams.get("driver") ?? "all";
  const sortBy = searchParams.get("sortBy") ?? "created_at";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const searchQuery = searchParams.get("search") ?? "";
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

    // Update certificate input
    setCertificateInput(searchParams.get("certificate") || "");
  }, [fromParam, toParam, searchParams]);
  const [problemAlert, setProblemAlert] = useState<{
    show: boolean;
    mission: Mission | null;
  }>({ show: false, mission: null });

  const handleProblemAlertAction = () => {
    if (problemAlert.mission) {
      router.push(`/deliveries/${problemAlert.mission.id}`);
    }
    setProblemAlert({ show: false, mission: null });
  };

  const dismissProblemAlert = () => {
    setProblemAlert({ show: false, mission: null });
  };



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

   // Helper to update date range in URL and state
   const updateDateRange = (range: DateRange | undefined) => {
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
   };
   // Clear all filters (status, car, driver, search, certificate, date range)
   const clearFilters = () => {
     setCertificateInput(""); // Clear certificate input
     const params = new URLSearchParams(searchParams.toString());
     ["status", "car", "driver", "search", "certificate", "dateFrom", "dateTo"].forEach((key) => {
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

  // Set up realtime subscription for problem status changes with fallback polling
  useEffect(() => {
    const supabase = getSupabaseClient();
    console.log('Setting up realtime subscription...');
    let fallbackInterval: NodeJS.Timeout;
    let lastCheckTime = Date.now();

    const channel = supabase
      .channel('public:missions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'missions',
          filter: `status=eq.problem`,
        },
         (payload: any) => {
           console.log('Mission changed to problem status:', payload);
           const mission = payload.new as Mission;
           // Only show alert if status actually changed TO problem
           if (payload.old && payload.old.status !== 'problem' && payload.new.status === 'problem') {
             setProblemAlert({ show: true, mission });
           }
         }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to missions updates');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime failed, falling back to polling for problem missions');
          
          // Fallback: poll for new problem missions every 10 seconds
          fallbackInterval = setInterval(async () => {
            try {
              const response = await fetch(`/api/orders?status=problem&updated_since=${lastCheckTime}`);
              if (response.ok) {
                const data = await response.json();
                if (data.missions && data.missions.length > 0) {
                  // Show alert for the most recent problem mission
                  const latestProblem = data.missions[0];
                  setProblemAlert({ show: true, mission: latestProblem });
                }
              }
              lastCheckTime = Date.now();
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, 10000);
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  return (
    <div className="space-y-1 h-screen flex flex-col">
      <div className="flex flex-col items-end gap-2 md:flex-row md:justify-between md:items-center flex-shrink-0">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">משלוחים</h1>
          <p className="text-muted-foreground mt-1">
            ניהול וצפייה בכל המשלוחים
          </p>
        </div>
        <div className="flex gap-2">
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
      </div>

      <Card className="shadow-sm flex flex-col">
        <CardHeader className="space-y-3 pb-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex flex-row items-center justify-between text-right text-xl w-full">
              <span>כל המשלוחים</span>
              {/* Date Range Popover */}
              <Popover>
                 <PopoverTrigger asChild>
                   <Button variant="outline" size="sm" className="w-64">
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
              searchQuery ||
              searchParams.get("certificate")) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
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
                 {searchParams.get("certificate") && (
                   <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                     תעודה: "{searchParams.get("certificate")}"
                   </span>
                 )}
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search, Filters and Clear - Left Side */}
            <div className="flex gap-2 order-1 flex-wrap items-center">
              {/* Search */}
              <div className="relative max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש משלוחים..."
                  className="pr-10 text-right h-9 w-48"
                  value={searchQuery}
                  onChange={(e) => updateParam("search", e.target.value)}
                />
              </div>

              {/* Certificate Search */}
              <div className="relative max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש לפי מספר תעודה..."
                  className="pr-10 text-right h-9 w-48"
                  value={certificateInput}
                  onChange={(e) => {
                    console.log('Certificate input changed:', e.target.value);
                    setCertificateInput(e.target.value);
                    updateParam("certificate", e.target.value);
                  }}
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => updateParam("status", value)}>
                <SelectTrigger className="w-32 h-9">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="hover:bg-transparent hover:text-foreground"
                  >
                    כל הסטטטוסים
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
                <SelectTrigger className="w-32 h-9">
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
                <SelectTrigger className="w-32 h-9">
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

              {/* Clear filters button */}
              <Button variant="outline" size="sm" className="h-9" onClick={clearFilters}>
                נקה מסננים
              </Button>
            </div>

            {/* Sort Controls - Right Side */}
            <div className="flex gap-2 order-2">
              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value) => updateParam("sortBy", value)}>
                <SelectTrigger className="w-32 h-9">
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
                <SelectTrigger className="w-28 h-9">
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
        <CardContent className="flex-1 p-4">
          <DeliveriesTable
            statusFilter={statusFilter}
            carFilter={carFilter}
            driverFilter={driverFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchQuery={searchQuery}
            certificateQuery={searchParams.get("certificate") || ""}
            dateRange={dateRange}
          />
        </CardContent>
      </Card>

      {/* Problem Alert Modal */}
      <AlertDialog open={problemAlert.show} onOpenChange={dismissProblemAlert}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-right">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              התראת בעיה במשלוח
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {problemAlert.mission && (
                <>
                  משלוח #{problemAlert.mission.id} של {problemAlert.mission.metadata?.client_name || "לקוח"} עבר לסטטוס "בעיה"
                  <br />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    סוג: {problemAlert.mission.type}
                    {problemAlert.mission.subtype && ` (${problemAlert.mission.subtype})`}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>סגור</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProblemAlertAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              צפה בפרטים
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
