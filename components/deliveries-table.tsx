"use client";
import type { DateRange } from "react-day-picker";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Mission } from "@/lib/types";
import {
  TableLoadingSkeleton,
  LoadingSpinner,
} from "@/components/loading-states";
import {
  getStatusColor,
  getStatusText,
  getAllStatuses,
} from "@/lib/status-helpers";
import { formatDate, formatTime } from "@/lib/date-helpers";
import { MissionActions } from "@/components/mission-actions";

// Number of items to show per page (fixed for consistent table height)
const ITEMS_PER_PAGE = 10;
// Number of pages to fetch in one batch before fetching next batch
// Number of pages fetched in one batch before hitting server again
const PAGE_GROUP_SIZE = 10;
// Total items fetched per group (ITEMS_PER_PAGE * PAGE_GROUP_SIZE)
const GROUP_LIMIT = ITEMS_PER_PAGE * PAGE_GROUP_SIZE;

interface DeliveriesTableProps {
  statusFilter?: string;
  typeFilter?: string;
  carFilter?: string;
  driverFilter?: string;
  sortBy?: string;
  sortOrder?: string;
  searchQuery?: string;
  certificateQuery?: string;
  dateRange?: DateRange;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onRefreshReady?: (refreshFn: () => Promise<void>) => void;
}

export function DeliveriesTable({
  statusFilter = "all",
  typeFilter = "all",
  carFilter = "all",
  driverFilter = "all",
  sortBy = "created_at",
  sortOrder = "desc",
  searchQuery = "",
  certificateQuery = "",
  dateRange,
  initialPage = 1,
  onPageChange,
  onRefreshReady,
}: DeliveriesTableProps) {
  const router = useRouter();
  // Cached group of pages data and total count
  const [groupData, setGroupData] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  // Which group of pages (0 = pages 1-10, 1 = 11-20, etc.)
  const [groupIndex, setGroupIndex] = useState(
    Math.floor((initialPage - 1) / PAGE_GROUP_SIZE),
  );
  // Total items across all pages
  const [totalItems, setTotalItems] = useState(0);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [missionToUpdate, setMissionToUpdate] = useState<Mission | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const isInitialRender = useRef(true);
  const prevFilters = useRef({
    statusFilter,
    typeFilter,
    carFilter,
    driverFilter,
    sortBy,
    sortOrder,
    searchQuery,
    dateRange,
  });

  // Sync currentPage with initialPage prop
  useEffect(() => {
    setCurrentPage(initialPage);
    setGroupIndex(Math.floor((initialPage - 1) / PAGE_GROUP_SIZE));
  }, [initialPage]);

  // Reset to first page group/page on filters/search/sort/date change (but not on initial load or navigation back)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevFilters.current = {
        statusFilter,
        typeFilter,
        carFilter,
        driverFilter,
        sortBy,
        sortOrder,
        searchQuery,
        dateRange,
      };
      return;
    }

    // Check if any filter actually changed
    const prev = prevFilters.current;
    const filtersChanged =
      prev.statusFilter !== statusFilter ||
      prev.typeFilter !== typeFilter ||
      prev.carFilter !== carFilter ||
      prev.driverFilter !== driverFilter ||
      prev.sortBy !== sortBy ||
      prev.sortOrder !== sortOrder ||
      prev.searchQuery !== searchQuery ||
      prev.dateRange !== dateRange;

    // Update the ref with current values
    prevFilters.current = {
      statusFilter,
      typeFilter,
      carFilter,
      driverFilter,
      sortBy,
      sortOrder,
      searchQuery,
      dateRange,
    };

    // Only reset page when filters actually changed
    if (filtersChanged) {
      setGroupIndex(0);
      setCurrentPage(1);
      if (onPageChange) onPageChange(1);
    }
  }, [
    statusFilter,
    typeFilter,
    carFilter,
    driverFilter,
    sortBy,
    sortOrder,
    searchQuery,
    dateRange,
  ]);

  // Fetch the current group of pages when filters, search, sort, or groupIndex change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGroupData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    statusFilter,
    typeFilter,
    carFilter,
    driverFilter,
    sortBy,
    sortOrder,
    dateRange,
    searchQuery,
    certificateQuery,
    groupIndex,
  ]);

  // 30-second polling as realtime fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGroupData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefreshReady) {
      const refreshFn = async () => {
        await fetchGroupData(false);
      };
      onRefreshReady(refreshFn);
    }
  }, [onRefreshReady]);

  // Fetch a batch of pages (group) from server
  const fetchGroupData = async (isPollingUpdate = false) => {
    // Only show loading state for initial loads, not polling updates
    if (!isPollingUpdate) {
      setLoading(true);
    }
    try {
      // Build query parameters including page-based pagination
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        car: carFilter,
        driver: driverFilter,
        sortBy,
        sortOrder,
        limit: GROUP_LIMIT.toString(),
      });
      // Page depends on current group of pages (API expects 1-based page numbers)
      const page = groupIndex + 1;
      params.set("page", page.toString());
      // Include search query if any
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      // Include certificate query if any
      if (certificateQuery) {
        params.append("certificate", certificateQuery);
      }
      // Date range filtering
      if (dateRange?.from) {
        params.append("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("dateTo", dateRange.to.toISOString());
      }
      const response = await fetch(`/api/orders?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          // Fallback for simple array responses
          setGroupData(result);
          setTotalItems(result.length);
        } else {
          setGroupData(result.data || []);
          setTotalItems(result.pagination?.total || 0);
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <TableLoadingSkeleton rows={ITEMS_PER_PAGE} columns={9} />;
  }

  // Compute total pages and slice out current page's items from the loaded group
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex =
    (currentPage - 1 - groupIndex * PAGE_GROUP_SIZE) * ITEMS_PER_PAGE;
  const currentMissions = groupData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      // If moving before current group start, shift to previous group
      const groupStartPage = groupIndex * PAGE_GROUP_SIZE + 1;
      if (newPage < groupStartPage) {
        setGroupIndex(groupIndex - 1);
      }
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      // If moving past current group end, shift to next group
      const groupEndPage = (groupIndex + 1) * PAGE_GROUP_SIZE;
      if (newPage > groupEndPage) {
        setGroupIndex(groupIndex + 1);
      }
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleStatusUpdateClick = (mission: Mission) => {
    setMissionToUpdate(mission);
    setNewStatus(mission.status);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdateConfirm = async () => {
    if (!missionToUpdate || !newStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${missionToUpdate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...missionToUpdate,
          status: newStatus,
          completed_at:
            newStatus === "completed" && !missionToUpdate.completed_at
              ? new Date().toISOString()
              : missionToUpdate.completed_at,
        }),
      });

      if (response.ok) {
        const updatedMission = await response.json();
        // Update the mission in state
        setGroupData((data) =>
          data.map((m) => (m.id === missionToUpdate.id ? updatedMission : m)),
        );
        setStatusDialogOpen(false);
        setMissionToUpdate(null);
        setNewStatus("");
        // Refresh data to ensure consistency
        await fetchGroupData(false);
      } else {
        // Silent error handling
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsUpdating(false);
    }
  };

  const getMissionUrl = (missionId: number) => {
    // Build returnTo URL with current search params
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href;
      const returnTo = encodeURIComponent(
        currentUrl.replace(window.location.origin, ""),
      );
      return `/deliveries/${missionId}?returnTo=${returnTo}`;
    }
    return `/deliveries/${missionId}`;
  };

  const handleViewDetails = (mission: Mission) => {
    router.push(getMissionUrl(mission.id));
  };

  return (
    <>
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">עדכון סטטוס משימה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                משימה #{missionToUpdate?.id} - {missionToUpdate?.type}
                {missionToUpdate?.subtype && ` (${missionToUpdate.subtype})`}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">
                בחר סטטוס חדש:
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {getAllStatuses().map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={isUpdating}
            >
              ביטול
            </Button>
            <Button onClick={handleStatusUpdateConfirm} disabled={isUpdating}>
              {isUpdating ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="mr-2">מעדכן...</span>
                </div>
              ) : (
                "עדכן סטטוס"
              )}
            </Button>
          </DialogFooter>
          {isUpdating && (
            <div aria-live="polite" className="sr-only">
              מעדכן סטטוס משימה...
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="h-full">
        <div className="rounded-md border overflow-x-auto">
          <Table role="table" aria-label="טבלת משלוחים" className="h-full">
            <caption className="sr-only">
              רשימת משלוחים. עמוד {currentPage} מתוך {totalPages}
            </caption>
            <TableHeader>
              <TableRow role="row">
                <TableHead scope="col" className="text-right">
                  לקוח
                </TableHead>
                <TableHead scope="col" className="text-right">
                  סוג
                </TableHead>
                <TableHead scope="col" className="text-right">
                  כתובת
                </TableHead>
                <TableHead scope="col" className="text-right">
                  נהג
                </TableHead>
                <TableHead
                  scope="col"
                  className="text-right hidden md:table-cell"
                >
                  רכב
                </TableHead>
                <TableHead scope="col" className="text-right w-24">
                  סטטוס
                </TableHead>
                <TableHead
                  scope="col"
                  className="text-right hidden lg:table-cell"
                >
                  הושלם ב
                </TableHead>
                <TableHead
                  scope="col"
                  className="text-right hidden sm:table-cell"
                >
                  תאריך צפוי
                </TableHead>
                <TableHead scope="col" className="text-right">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMissions.map((mission) => (
                <TableRow key={mission.id} className="h-16" role="row">
                  <TableCell className="text-right font-semibold h-16 text-base">
                    <HoverCard openDelay={0}>
                      <HoverCardTrigger asChild>
                        <Link href={getMissionUrl(mission.id)}>
                          <span className="truncate max-w-40 cursor-pointer hover:underline decoration-2 underline-offset-2 transition-all inline-block">
                            {mission.metadata?.client_name || "לא צוין"}
                          </span>
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" side="left">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">פרטי לקוח</h4>
                            <p className="text-sm text-muted-foreground">
                              {mission.metadata?.client_name || "לא צוין"}
                            </p>
                          </div>
                          {(mission.metadata?.phone_number ||
                            mission.address) && (
                            <div className="space-y-2">
                              {mission.metadata?.phone_number && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    📞
                                  </span>
                                  <span className="text-sm">
                                    {mission.metadata.phone_number}
                                  </span>
                                </div>
                              )}
                              {mission.address && (
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    📍
                                  </span>
                                  <div className="text-sm">
                                    <div>{mission.address.address}</div>
                                    <div className="text-muted-foreground">
                                      {mission.address.city}{" "}
                                      {mission.address.zip_code}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <div className="text-sm">
                      <div className="font-medium">{mission.type}</div>
                      {mission.subtype && (
                        <div className="text-muted-foreground text-xs">
                          {mission.subtype}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right h-16 max-w-32 sm:max-w-xs">
                    <div className="text-sm">
                      <div className="truncate">{mission.address.address}</div>
                      <div className="text-muted-foreground text-xs truncate">
                        {mission.address.city} {mission.address.zip_code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right h-16">
                    <div className="text-sm">
                      <div className="truncate max-w-24 sm:max-w-32">
                        {mission.driver || (
                          <span className="text-muted-foreground">
                            ללא הקצאה
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right h-16 hidden md:table-cell">
                    {mission.car_number || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right h-16 w-24">
                    <Badge
                      className={`${getStatusColor(mission.status)} px-2 py-1 text-xs whitespace-nowrap w-full justify-center cursor-pointer transition-colors`}
                      role="status"
                      aria-label={`סטטוס משימה: ${getStatusText(mission.status)}`}
                    >
                      {getStatusText(mission.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right h-16 hidden lg:table-cell">
                    {mission.completed_at ? (
                      <div className="text-sm">
                        <div>{formatDate(mission.completed_at)}</div>
                        <div className="text-muted-foreground">
                          {formatTime(mission.completed_at)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right h-16 hidden sm:table-cell">
                    {mission.date_expected ? (
                      <div className="text-sm">
                        <div>{formatDate(mission.date_expected)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">לא צוין</span>
                    )}
                  </TableCell>
                  <TableCell className="h-16">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          aria-label={`פעולות עבור משימה ${mission.id}`}
                          aria-haspopup="menu"
                        >
                          <MoreHorizontal
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" role="menu">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(mission)}
                          role="menuitem"
                          aria-label={`צפה בפרטי משימה ${mission.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
                          צפה בפרטים
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdateClick(mission)}
                          role="menuitem"
                          aria-label={`עדכן סטטוס משימה ${mission.id}`}
                        >
                          <Edit className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
                          עדכן סטטוס
                        </DropdownMenuItem>
                        <MissionActions
                          mission={mission}
                          onUpdate={() => {
                            fetchGroupData(false);
                          }}
                          onDelete={() =>
                            setGroupData((data) =>
                              data.filter((m) => m.id !== mission.id),
                            )
                          }
                          asDropdownItems={true}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {/* Fill empty rows to fill the entire available height */}
              {Array.from({
                length: Math.max(0, ITEMS_PER_PAGE - currentMissions.length),
              }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-16">
                  <TableCell
                    className="h-16 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    &nbsp;
                  </TableCell>
                </TableRow>
              ))}

              {/* Show no results message if no items at all */}
              {totalItems === 0 && (
                <TableRow>
                  <TableCell className="h-32 text-center" colSpan={9}>
                    <div className="text-muted-foreground">
                      {searchQuery
                        ? "לא נמצאו תוצאות חיפוש"
                        : "אין משימות להציג"}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
              <span>הקודם</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              עמוד {currentPage} מתוך {totalPages}
            </span>
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
    </>
  );
}
