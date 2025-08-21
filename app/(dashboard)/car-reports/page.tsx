'use client';

import { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('inspection_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  return (
    <div className="space-y-6 p-8 pt-6">
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort By and Sort Order */}
            <div className="flex gap-2 order-1 md:order-2 flex-wrap">
              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspection_date">תאריך בדיקה</SelectItem>
                  <SelectItem value="vehicle_number">מספר רכב</SelectItem>
                  <SelectItem value="driver_name">שם נהג</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
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
            page={page}
            limit={limit}
          />
          {/* Pagination controls will be added here later */}
        </CardContent>
      </Card>
    </div>
  );
}