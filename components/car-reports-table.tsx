'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { VehicleInspection } from '@/lib/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { vehicleInspectionLabels } from '@/lib/constants';

interface CarReportsTableProps {
  searchQuery: string;
  sortBy: string;
  sortOrder: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

// Number of items to show per page (matching deliveries)
const ITEMS_PER_PAGE = 10;

export function CarReportsTable({
  searchQuery,
  sortBy,
  sortOrder,
  initialPage = 1,
  onPageChange = () => {},
}: CarReportsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReports, setTotalReports] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Calculate pagination
  const totalPages = Math.ceil(totalReports / ITEMS_PER_PAGE);
  const handlePreviousPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    setCurrentPage(newPage);
    onPageChange(newPage);
  };
  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages);
    setCurrentPage(newPage);
    onPageChange(newPage);
  };

  const handleEdit = (reportId: string) => {
    router.push(`/car-reports/${reportId}/edit`);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק דוח זה?')) {
      return;
    }

    setDeleting(reportId);
    try {
      const response = await fetch(`/api/car-reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete report');
      }

      toast({
        title: 'הדוח נמחק',
        description: 'דוח הרכב נמחק בהצלחה',
      });

      // Remove the deleted report from the list
      setReports(reports.filter(report => report.id !== reportId));
      setTotalReports(prev => prev - 1);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Update current page when initialPage changes
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: searchQuery,
          sortBy: sortBy,
          sortOrder: sortOrder,
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        const response = await fetch(`/api/car-reports?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch car reports');
        }

        const data = await response.json();
        setReports(data.data || data || []);
        setTotalReports(data.pagination?.total || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [searchQuery, sortBy, sortOrder, currentPage]);

  if (loading) {
    return (
      <div className="h-full">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{vehicleInspectionLabels.vehicleNumber}</TableHead>
                <TableHead className="text-right">{vehicleInspectionLabels.driverName}</TableHead>
                <TableHead className="text-right">{vehicleInspectionLabels.inspectionDate}</TableHead>
                <TableHead className="text-right">{vehicleInspectionLabels.odometerReading}</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="h-16">
                  <TableCell className="text-right h-16">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Loading pagination skeleton */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">שגיאה: {error}</div>;
  }

  return (
    <div className="h-full">
      <div className="rounded-md border overflow-x-auto">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {searchQuery
                ? "לא נמצאו תוצאות חיפוש"
                : "אין דוחות רכב זמינים"}
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{vehicleInspectionLabels.vehicleNumber}</TableHead>
                <TableHead className="text-right">{vehicleInspectionLabels.driverName}</TableHead>
                <TableHead className="text-right">{vehicleInspectionLabels.inspectionDate}</TableHead>
                <TableHead className="text-right">{vehicleInspectionLabels.odometerReading}</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow 
                  key={report.id} 
                  className="h-16 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/car-reports/${report.id}`)}
                >
                  <TableCell className="text-right h-16">{report.metadata?.vehicleNumber || 'לא זמין'}</TableCell>
                  <TableCell className="text-right h-16">{report.metadata?.driverName || 'לא זמין'}</TableCell>
                  <TableCell className="text-right h-16">
                    {report.metadata?.inspectionDate 
                      ? new Date(report.metadata.inspectionDate).toLocaleDateString('he-IL')
                      : 'לא זמין'
                    }
                  </TableCell>
                  <TableCell className="text-right h-16">{report.metadata?.odometerReading || 'לא זמין'}</TableCell>
                  <TableCell className="text-right h-16">
                    <Badge 
                      variant={report.metadata?.status === 'good' ? 'default' : 'destructive'}
                      className={report.metadata?.status === 'good' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {report.metadata?.status === 'good' ? 'תקין' : 'לא תקין'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right h-16" onClick={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-1" align="end">
                        <div className="space-y-1">
                          <Link href={`/car-reports/${report.id}`}>
                            <Button variant="ghost" size="sm" className="w-full justify-start">
                              <Eye className="ml-2 h-4 w-4" />
                              צפה
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start"
                            onClick={() => handleEdit(report.id)}
                          >
                            <Edit className="ml-2 h-4 w-4" />
                            עריכה
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-destructive"
                            onClick={() => handleDelete(report.id)}
                            disabled={deleting === report.id}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            {deleting === report.id ? 'מוחק...' : 'מחיקה'}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
              {/* Fill empty rows to maintain consistent table height */}
              {Array.from({
                length: Math.max(0, ITEMS_PER_PAGE - reports.length),
              }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-16">
                  <TableCell
                    className="h-16 text-center text-muted-foreground"
                    colSpan={6}
                  >
                    &nbsp;
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {/* Always show pagination info for debugging, hide buttons only when not needed */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          style={{ visibility: totalPages > 1 ? 'visible' : 'hidden' }}
        >
          <ChevronRight className="h-4 w-4" />
          <span>הקודם</span>
        </Button>
        <span className="text-sm text-muted-foreground">
          עמוד {currentPage} מתוך {totalPages} (סה"כ {totalReports} דוחות)
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{ visibility: totalPages > 1 ? 'visible' : 'hidden' }}
        >
          <span>הבא</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
