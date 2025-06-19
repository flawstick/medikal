"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Eye, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import type { Mission, MissionStatus } from "@/lib/types"
import { TableLoadingSkeleton, LoadingSpinner } from "@/components/loading-states"
import { getStatusColor, getStatusText, getAllStatuses } from "@/lib/status-helpers"
import { formatDate, formatTime } from "@/lib/date-helpers"

const ITEMS_PER_PAGE = 15


interface DeliveriesTableProps {
  statusFilter?: string
  typeFilter?: string
  carFilter?: string
  driverFilter?: string
  sortBy?: string
  sortOrder?: string
  searchQuery?: string
}

export function DeliveriesTable({ 
  statusFilter = "all",
  typeFilter = "all",
  carFilter = "all",
  driverFilter = "all",
  sortBy = "created_at", 
  sortOrder = "desc", 
  searchQuery = "" 
}: DeliveriesTableProps) {
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [missionToUpdate, setMissionToUpdate] = useState<Mission | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")

  useEffect(() => {
    fetchMissions()
  }, [statusFilter, typeFilter, carFilter, driverFilter, sortBy, sortOrder])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [statusFilter, typeFilter, carFilter, driverFilter, sortBy, sortOrder, searchQuery])

  const fetchMissions = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        car: carFilter,
        driver: driverFilter,
        sortBy,
        sortOrder,
      })
      
      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const result = await response.json()
        // Handle both old array format and new paginated format
        const data = Array.isArray(result) ? result : result.data || []
        setMissions(data)
      }
    } catch (error) {
      console.error("Error fetching missions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <TableLoadingSkeleton rows={ITEMS_PER_PAGE} columns={9} />
  }

  // Filter missions based on search query
  const filteredMissions = missions.filter(mission => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    const addressString = `${mission.address.address} ${mission.address.city} ${mission.address.zip_code}`
    return (
      mission.id.toString().includes(searchLower) ||
      mission.type.toLowerCase().includes(searchLower) ||
      mission.subtype?.toLowerCase().includes(searchLower) ||
      addressString.toLowerCase().includes(searchLower) ||
      mission.driver?.toLowerCase().includes(searchLower) ||
      mission.car_number?.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE)
  const currentMissions = filteredMissions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handleDeleteClick = (mission: Mission) => {
    setMissionToDelete(mission)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!missionToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${missionToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove the deleted mission from state
        setMissions(missions => missions.filter(mission => mission.id !== missionToDelete.id))
        setDeleteDialogOpen(false)
        setMissionToDelete(null)
      } else {
        console.error('Failed to delete mission')
      }
    } catch (error) {
      console.error('Error deleting mission:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusUpdateClick = (mission: Mission) => {
    setMissionToUpdate(mission)
    setNewStatus(mission.status)
    setStatusDialogOpen(true)
  }

  const handleStatusUpdateConfirm = async () => {
    if (!missionToUpdate || !newStatus) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${missionToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...missionToUpdate,
          status: newStatus,
          completed_at: newStatus === 'completed' && !missionToUpdate.completed_at 
            ? new Date().toISOString() 
            : missionToUpdate.completed_at,
        }),
      })

      if (response.ok) {
        const updatedMission = await response.json()
        // Update the mission in state
        setMissions(missions => missions.map(mission => 
          mission.id === missionToUpdate.id ? updatedMission : mission
        ))
        setStatusDialogOpen(false)
        setMissionToUpdate(null)
        setNewStatus("")
      } else {
        console.error('Failed to update mission status')
      }
    } catch (error) {
      console.error('Error updating mission status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewDetails = (mission: Mission) => {
    router.push(`/deliveries/${mission.id}`)
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת משימה</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את משימה #{missionToDelete?.id}?
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="mr-2">מוחק...</span>
                </div>
              ) : (
                "מחק"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
          {isDeleting && (
            <div aria-live="polite" className="sr-only">
              מוחק משימה...
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

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
              <label className="text-sm font-medium text-right block">בחר סטטוס חדש:</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {getAllStatuses().map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isUpdating}>
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
      
      <div>
        <div className="rounded-md border overflow-x-auto">
        <Table role="table" aria-label="טבלת משלוחים">
          <caption className="sr-only">
            רשימת משלוחים עם פרטי סטטוס, כתובת, נהג ופעולות זמינות. מציגה {currentMissions.length} מתוך {filteredMissions.length} משימות
          </caption>
          <TableHeader>
            <TableRow role="row">
              <TableHead scope="col" className="text-right">מזהה</TableHead>
              <TableHead scope="col" className="text-right">סוג</TableHead>
              <TableHead scope="col" className="text-right">כתובת</TableHead>
              <TableHead scope="col" className="text-right">נהג</TableHead>
              <TableHead scope="col" className="text-right hidden md:table-cell">רכב</TableHead>
              <TableHead scope="col" className="text-right w-24">סטטוס</TableHead>
              <TableHead scope="col" className="text-right hidden lg:table-cell">הושלם ב</TableHead>
              <TableHead scope="col" className="text-right hidden sm:table-cell">תאריך צפוי</TableHead>
              <TableHead scope="col" className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMissions.map((mission) => (
              <TableRow key={mission.id} className="h-16" role="row">
                <TableCell className="text-right font-medium h-16">#{mission.id}</TableCell>
                <TableCell className="text-right h-16">
                  <div className="text-sm">
                    <div className="font-medium">{mission.type}</div>
                    {mission.subtype && (
                      <div className="text-muted-foreground text-xs">{mission.subtype}</div>
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
                      {mission.driver || <span className="text-muted-foreground">ללא הקצאה</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right h-16 hidden md:table-cell">
                  {mission.car_number || <span className="text-muted-foreground">-</span>}
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
                      <div className="text-muted-foreground">{formatTime(mission.completed_at)}</div>
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
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" role="menu">
                      <DropdownMenuItem 
                        onClick={() => handleViewDetails(mission)}
                        role="menuitem"
                        aria-label={`צפה בפרטי משימה ${mission.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" /> צפה בפרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdateClick(mission)}
                        role="menuitem"
                        aria-label={`עדכן סטטוס משימה ${mission.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" aria-hidden="true" /> עדכן סטטוס
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                        onClick={() => handleDeleteClick(mission)}
                        role="menuitem"
                        aria-label={`מחק משימה ${mission.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> מחק משימה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {/* Fill empty rows to maintain consistent height */}
            {currentMissions.length < ITEMS_PER_PAGE &&
              Array.from({ length: ITEMS_PER_PAGE - currentMissions.length }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-16">
                  <TableCell className="h-16" colSpan={9}>
                    &nbsp;
                  </TableCell>
                </TableRow>
              ))}
            
            {/* Show no results message if filtered orders is empty */}
            {filteredMissions.length === 0 && (
              <TableRow>
                <TableCell className="h-32 text-center" colSpan={9}>
                  <div className="text-muted-foreground">
                    {searchQuery ? "לא נמצאו תוצאות חיפוש" : "אין משימות להציג"}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            <ChevronRight className="h-4 w-4" />
            <span>הקודם</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            עמוד {currentPage} מתוך {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
            <span>הבא</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      </div>
    </>
  )
}
