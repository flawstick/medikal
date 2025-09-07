"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import type { Mission } from "@/lib/types";

import { DeliveriesTable } from "@/components/deliveries-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DateRangePicker } from "@/components/deliveries/date-range-picker";
import { SearchAndFilters } from "@/components/deliveries/search-and-filters";
import { ActiveFiltersDisplay } from "@/components/deliveries/active-filters-display";
import { SortControls } from "@/components/deliveries/sort-controls";
import { ProblemAlertModal } from "@/components/deliveries/problem-alert-modal";
import { useDeliveriesFilters } from "@/hooks/useDeliveriesFilters";
import { FlowButton } from "@/components/ui/flow-button";

export default function DeliveriesPage() {
  const router = useRouter();
  const { filters, actions, cars, drivers, certificateInput } =
    useDeliveriesFilters();

  const [problemAlert, setProblemAlert] = useState<{
    show: boolean;
    mission: Mission | null;
  }>({ show: false, mission: null });

  const [refreshing, setRefreshing] = useState(false);
  const refreshFunctionRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefresh = async () => {
    if (refreshFunctionRef.current) {
      setRefreshing(true);
      try {
        await refreshFunctionRef.current();
      } finally {
        setRefreshing(false);
      }
    }
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
    <TooltipProvider>
      <div className="relative z-0 flex flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[64rem] w-[64rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.violet.400/.22),theme(colors.fuchsia.400/.16),transparent_65%)] blur-[140px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.violet.700/.14),theme(colors.fuchsia.700/.10),transparent_65%)]" />
        <div className="absolute right-[-15%] top-[8%] h-[56rem] w-[56rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.sky.400/.20),theme(colors.indigo.400/.16),transparent_65%)] blur-[140px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.sky.700/.12),theme(colors.indigo.700/.10),transparent_65%)]" />
        <div className="absolute left-[12%] bottom-[-12%] h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.amber.300/.18),theme(colors.orange.400/.14),transparent_65%)] blur-[140px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.amber.500/.10),theme(colors.orange.600/.08),transparent_65%)]" />
        <div className="absolute right-[8%] bottom-[-18%] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.emerald.400/.18),theme(colors.teal.400/.14),transparent_65%)] blur-[140px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.emerald.600/.10),theme(colors.teal.600/.08),transparent_65%)]" />
      </div>
      <div className="sticky top-0 z-10 -mt-4 pb-3">
        <div className="absolute inset-x-0 top-0 h-[88px] -z-10" />
        <div className="-mx-[calc(theme(spacing.8))] px-[calc(theme(spacing.8))] pt-4 pb-3 flex flex-col items-end gap-2 md:flex-row md:justify-between md:items-center">
          <div className="text-right">
            <h1 className="text-3xl font-extrabold tracking-tight">משלוחים</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              ניהול וצפייה בכל המשלוחים
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/upload" className="inline-block">
              <FlowButton text="ייבא משלוחים" />
            </Link>
          </div>
        </div>
      </div>

      <Card className="shadow-sm flex flex-col mt-4">
        <CardHeader className="space-y-3 pb-3 px-4 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex flex-row items-center justify-between text-right text-xl w-full gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">כל המשלוחים</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <RefreshCw
                        className={`${refreshing ? "animate-spin" : ""} h-4 w-4`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>רענן משלוחים</p>
                  </TooltipContent>
                </Tooltip>
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
              onSortOrderChange={(value) =>
                actions.updateParam("sortOrder", value)
              }
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
              onRefreshReady={(fn) => { refreshFunctionRef.current = fn; }}
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
    </TooltipProvider>
  );
}
