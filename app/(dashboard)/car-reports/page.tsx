'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown } from 'lucide-react';
import { CarReportsTable } from '@/components/car-reports-table';

export default function CarReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract filters from URL params (matching deliveries pattern)
  const searchQuery = searchParams.get("search") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "created_at";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const currentPage = parseInt(searchParams.get("page") || "1");

  // Helper to update individual search params in URL (matching deliveries pattern)
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
    router.push(`/car-reports${queryString ? `?${queryString}` : ""}`);
  }, [searchParams, router]);

  // Helper to update page parameter (matching deliveries pattern)
  const updatePage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    router.push(`/car-reports${queryString ? `?${queryString}` : ""}`);
  }, [searchParams, router]);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col items-end gap-2 md:flex-row md:justify-between md:items-center">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">דוחות רכב</h1>
          <p className="text-muted-foreground mt-1">
            ניהול וצפייה בכל דוחות בדיקת הרכב
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex flex-row items-center justify-between text-right text-xl w-full">
              <span>כל דוחות הרכב</span>
            </CardTitle>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xs order-3 md:order-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש לפי מספר רכב או שם נהג..."
                className="pr-10 text-right"
                value={searchQuery}
                onChange={(e) => updateParam("search", e.target.value)}
              />
            </div>

            {/* Sort By and Sort Order */}
            <div className="flex gap-2 order-1 md:order-2 flex-wrap">
              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value) => updateParam("sortBy", value)}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">תאריך יצירה</SelectItem>
                  <SelectItem value="inspection_date">תאריך בדיקה</SelectItem>
                  <SelectItem value="vehicle_number">מספר רכב</SelectItem>
                  <SelectItem value="driver_name">שם נהג</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(value) => updateParam("sortOrder", value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">חדש לישן</SelectItem>
                  <SelectItem value="asc">ישן לחדש</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CarReportsTable
            searchQuery={searchQuery}
            sortBy={sortBy}
            sortOrder={sortOrder}
            initialPage={currentPage}
            onPageChange={updatePage}
          />
        </CardContent>
      </Card>
    </div>
  );
}