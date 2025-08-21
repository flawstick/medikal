"use client";

import { Suspense, lazy, useState } from "react";
import { DashboardStats } from "@/components/dashboard-stats";
import { DashboardDeliveriesTable } from "@/components/dashboard-deliveries-table";
import { HeaderDatePicker } from "@/components/header-date-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ChartLoadingSkeleton } from "@/components/loading-states";

// Lazy load the chart component since it's heavy and not immediately visible
const DeliveryAnalyticsChart = lazy(() =>
  import("@/components/delivery-analytics-chart").then((module) => ({
    default: module.DeliveryAnalyticsChart,
  })),
);

export default function Dashboard() {
  return (
    <div className="relative z-0">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-[60rem] w-[60rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.fuchsia.400/.30),theme(colors.pink.400/.22),transparent_60%)] blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.fuchsia.600/.16),theme(colors.pink.700/.10),transparent_60%)]" />
        <div className="absolute right-[-20%] top-[10%] h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.indigo.400/.28),theme(colors.sky.400/.22),transparent_60%)] blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.indigo.700/.16),theme(colors.sky.700/.10),transparent_60%)]" />
        <div className="absolute left-[15%] bottom-[-10%] h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.amber.400/.28),theme(colors.orange.400/.20),transparent_60%)] blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.amber.500/.14),theme(colors.orange.600/.08),transparent_60%)]" />
        <div className="absolute right-[10%] bottom-[-15%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.emerald.400/.24),theme(colors.teal.400/.20),transparent_60%)] blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.emerald.600/.12),theme(colors.teal.600/.08),transparent_60%)]" />
      </div>

      <div className="space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between">
          <HeaderDatePicker
            onDateChange={(d) => {
              if (!d) return;
              // no-op here, relying on internal chart range unless we pass props
            }}
          />
          <Button size="default" asChild>
            <Link href="/upload">
              <Plus className="ml-2 h-4 w-4" />
              הזמנה חדשה
            </Link>
          </Button>
        </div>

        <DashboardStats />

        <Suspense fallback={<ChartLoadingSkeleton />}>
          <DeliveryAnalyticsChart />
        </Suspense>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-right">משלוחים אחרונים</CardTitle>
            <CardDescription className="text-right">
              רשימת המשלוחים האחרונים במערכת
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardDeliveriesTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
