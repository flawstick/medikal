"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import type { Mission } from "@/lib/types";

import { DeliveriesTable } from "@/components/deliveries-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DateRangePicker } from "@/components/deliveries/date-range-picker";
import { SearchAndFilters } from "@/components/deliveries/search-and-filters";
import { ActiveFiltersDisplay } from "@/components/deliveries/active-filters-display";
import { SortControls } from "@/components/deliveries/sort-controls";
import { ProblemAlertModal } from "@/components/deliveries/problem-alert-modal";
import { useDeliveriesFilters } from "@/hooks/useDeliveriesFilters";

export default function DeliveriesPage() {
  const router = useRouter();
  const { filters, actions, cars, drivers, certificateInput } = useDeliveriesFilters();
  
  const [problemAlert, setProblemAlert] = useState<{
    show: boolean;
    mission: Mission | null;
  }>({ show: false, mission: null });
  
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const handleProblemAlertAction = () => {
    if (problemAlert.mission) {
      router.push(`/deliveries/${problemAlert.mission.id}`);
    }
    setProblemAlert({ show: false, mission: null });
  };

  const dismissProblemAlert = () => {
    setProblemAlert({ show: false, mission: null });
  };




  // TODO: Re-enable realtime when WebSocket connectivity is resolved
  // Set up realtime subscription for problem status changes with fallback polling
  // useEffect(() => {
  //   const supabase = getSupabaseClient();
  //   console.log('Setting up realtime subscription...');
  //   let fallbackInterval: NodeJS.Timeout;
  //   let lastCheckTime = Date.now();

  //   const channel = supabase
  //     .channel('public:missions')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'missions',
  //         filter: `status=eq.problem`,
  //       },
  //        (payload: any) => {
  //          console.log('Mission changed to problem status:', payload);
  //          const mission = payload.new as Mission;
  //          // Only show alert if status actually changed TO problem
  //          if (payload.old && payload.old.status !== 'problem' && payload.new.status === 'problem') {
  //            setProblemAlert({ show: true, mission });
  //          }
  //        }
  //     )
  //     .subscribe((status) => {
  //       console.log('Realtime subscription status:', status);
  //       if (status === 'SUBSCRIBED') {
  //         console.log('Successfully subscribed to missions updates');
  //       } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
  //         console.warn('Realtime failed - no fallback polling');
  //       }
  //     });

  //   return () => {
  //     console.log('Cleaning up realtime subscription...');
  //     supabase.removeChannel(channel);
  //     if (fallbackInterval) {
  //       clearInterval(fallbackInterval);
  //     }
  //   };
  // }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="sticky top-0 z-10 -mt-6 -mb-2">
        <div className="absolute inset-x-0 top-0 h-[88px] -z-10">
          <div className="w-full h-full bg-gradient-to-b from-background/80 to-background/40 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-border/60" />
        </div>
        <div className="-mx-[calc(theme(spacing.8))] px-[calc(theme(spacing.8))] pt-4 pb-3 flex flex-col items-end gap-2 md:flex-row md:justify-between md:items-center">
          <div className="text-right">
            <h1 className="text-3xl font-extrabold tracking-tight">משלוחים</h1>
            <p className="text-muted-foreground mt-1 text-sm">ניהול וצפייה בכל המשלוחים</p>
          </div>
          <div className="flex gap-2">
            <Button size="lg" asChild className="rounded-full shadow-sm hover:shadow transition-all">
              <Link href="/upload" className="inline-flex items-center gap-2 group">
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                משלוח חדש
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-sm flex flex-col mt-3">
        <CardHeader className="space-y-3 pb-3 px-4 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex flex-row items-center justify-between text-right text-xl w-full gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">כל המשלוחים</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <RefreshCw className={`${refreshing ? 'animate-spin' : ''} h-4 w-4`} />
                </Button>
              </div>
              <DateRangePicker
                dateRange={filters.dateRange}
                onDateRangeChange={actions.updateDateRange}
              />
            </CardTitle>
            <ActiveFiltersDisplay
              statusFilter={filters.statusFilter}
              carFilter={filters.carFilter}
              driverFilter={filters.driverFilter}
              searchQuery={filters.searchQuery}
              certificateQuery={filters.certificateQuery}
              cars={cars}
              drivers={drivers}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchAndFilters
              searchQuery={filters.searchQuery}
              certificateQuery={certificateInput}
              statusFilter={filters.statusFilter}
              carFilter={filters.carFilter}
              driverFilter={filters.driverFilter}
              cars={cars}
              drivers={drivers}
              onSearchChange={(value) => actions.updateParam("search", value)}
              onCertificateChange={(value) => {
                actions.setCertificateInput(value);
                actions.updateParam("certificate", value);
              }}
              onStatusChange={(value) => actions.updateParam("status", value)}
              onCarChange={(value) => actions.updateParam("car", value)}
              onDriverChange={(value) => actions.updateParam("driver", value)}
              onClearFilters={actions.clearFilters}
            />

            <SortControls
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSortByChange={(value) => actions.updateParam("sortBy", value)}
              onSortOrderChange={(value) => actions.updateParam("sortOrder", value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="p-4">
            <DeliveriesTable
              statusFilter={filters.statusFilter}
              carFilter={filters.carFilter}
              driverFilter={filters.driverFilter}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              searchQuery={filters.searchQuery}
              certificateQuery={filters.certificateQuery}
              dateRange={filters.dateRange}
              initialPage={filters.currentPage}
              onPageChange={actions.updatePage}
            />
          </div>
        </CardContent>
      </Card>

      <ProblemAlertModal
        isOpen={problemAlert.show}
        mission={problemAlert.mission}
        onClose={dismissProblemAlert}
        onViewDetails={handleProblemAlertAction}
      />
    </div>
  );
}
