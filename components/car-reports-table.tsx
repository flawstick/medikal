'use client';

import { useEffect, useState } from 'react';
import { VehicleInspection } from '@/lib/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { vehicleInspectionLabels } from '@/lib/constants';

interface CarReportsTableProps {
  searchQuery: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

export function CarReportsTable({
  searchQuery,
  sortBy,
  sortOrder,
  page,
  limit,
}: CarReportsTableProps) {
  const [reports, setReports] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReports, setTotalReports] = useState(0);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: searchQuery,
          sortBy: sortBy,
          sortOrder: sortOrder,
          page: page.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/car-reports?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch car reports');
        }

        const data = await response.json();
        setReports(data.data);
        setTotalReports(data.pagination.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [searchQuery, sortBy, sortOrder, page, limit]);

  if (loading) {
    return <div className="text-center py-8">טוען דוחות רכב...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">שגיאה: {error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      {reports.length === 0 ? (
        <p className="text-center py-8">אין דוחות רכב זמינים.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{vehicleInspectionLabels.vehicleNumber}</TableHead>
              <TableHead>{vehicleInspectionLabels.driverName}</TableHead>
              <TableHead>{vehicleInspectionLabels.inspectionDate}</TableHead>
              <TableHead>{vehicleInspectionLabels.odometerReading}</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.vehicleNumber}>
                <TableCell>{report.vehicleNumber}</TableCell>
                <TableCell>{report.driverName}</TableCell>
                <TableCell>{new Date(report.inspectionDate).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>{report.odometerReading}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/car-reports/${report.id}`}>
                    <Button variant="outline" size="sm">
                      צפה <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {/* Pagination controls would go here, similar to deliveries table */}
      {/* For now, just showing total reports */}
      <div className="text-center mt-4">
        סה"כ דוחות: {totalReports}
      </div>
    </div>
  );
}
