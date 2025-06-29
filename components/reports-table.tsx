"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { HeaderDatePicker } from "./header-date-picker";
import { TableLoadingSkeleton } from "./loading-states";

export type Report = {
  id: string;
  type: "general" | "crash";
  incident_date: string | null;
  incident_time: string;
  incident_description: string;
  driver_at_time: string | null;
  vehicle_number: string | null;
};

const ITEMS_PER_PAGE = 15;

export function ReportsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  const reportType = searchParams.get("type") || "all";
  const date = searchParams.get("date");

  React.useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (reportType && reportType !== "all") {
          params.append("type", reportType);
        }
        if (date) {
          params.append("date", date);
        }

        const response = await fetch(`/api/reports?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [reportType, date]);

  const handleDateChange = (selectedDate: Date | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (selectedDate) {
      params.set("date", format(selectedDate, "yyyy-MM-dd"));
    } else {
      params.delete("date");
    }
    router.push(`/reports?${params.toString()}`);
  };

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams);
    if (type && type !== "all") {
      params.set("type", type);
    } else {
      params.delete("type");
    }
    router.push(`/reports?${params.toString()}`);
  };

  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const currentReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return <TableLoadingSkeleton rows={ITEMS_PER_PAGE} columns={6} />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <HeaderDatePicker onDateChange={handleDateChange} />
        <Select onValueChange={handleTypeChange} defaultValue={reportType}>
          <SelectTrigger className="w-[180px] mr-4">
            <SelectValue placeholder="סנן לפי סוג" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="general">כללי</SelectItem>
            <SelectItem value="crash">תאונה</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">סוג</TableHead>
              <TableHead className="text-right">נהג</TableHead>
              <TableHead className="text-right">רכב</TableHead>
              <TableHead className="text-right">תאריך אירוע</TableHead>
              <TableHead className="text-right">תיאור</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReports.length > 0 ? (
              currentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="capitalize text-right">{report.type === 'crash' ? 'תאונה' : 'כללי'}</TableCell>
                  <TableCell className="text-right">{report.driver_at_time || "לא צוין"}</TableCell>
                  <TableCell className="text-right">{report.vehicle_number || "לא צוין"}</TableCell>
                  <TableCell className="text-right">
                    {report.incident_date
                      ? format(new Date(report.incident_date), "PPP")
                      : "לא צוין"}
                  </TableCell>
                  <TableCell className="truncate max-w-xs text-right">
                    {report.incident_description}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">פתח תפריט</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(report.id)
                          }
                        >
                          העתק מזהה דיווח
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/reports/${report.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          צפה בפרטי הדיווח
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  אין תוצאות.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
             <ChevronRight className="h-4 w-4" />
            <span>הקודם</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <span>הבא</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
