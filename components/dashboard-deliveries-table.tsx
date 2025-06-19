"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Mission, MissionStatus } from "@/lib/types"

const DASHBOARD_ITEMS_LIMIT = 5

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "waiting":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "problem":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "unassigned":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "הושלם"
    case "in_progress":
      return "בדרך"
    case "waiting":
      return "ממתין"
    case "problem":
      return "בעיה"
    case "unassigned":
      return "ללא הקצאה"
    default:
      return status
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("he-IL")
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function TableSkeleton() {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">מזהה</TableHead>
            <TableHead className="text-right">סוג משימה</TableHead>
            <TableHead className="text-right">כתובת</TableHead>
            <TableHead className="text-right">תעודות</TableHead>
            <TableHead className="text-right w-24">סטטוס</TableHead>
            <TableHead className="text-right hidden sm:table-cell">זמן נוצר</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: DASHBOARD_ITEMS_LIMIT }).map((_, i) => (
            <TableRow key={i} className="h-16">
              <TableCell className="text-right h-16">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="text-right h-16">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </TableCell>
              <TableCell className="text-right h-16">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="text-right h-16">
                <Skeleton className="h-4 w-6" />
              </TableCell>
              <TableCell className="text-right h-16 w-24">
                <Skeleton className="h-6 w-full rounded-full" />
              </TableCell>
              <TableCell className="text-right h-16 hidden sm:table-cell">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </TableCell>
              <TableCell className="h-16">
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function DashboardDeliveriesTable() {
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [missionToDelete, setMissionToDelete] = useState<Mission | null>(null)
  const [missionToUpdate, setMissionToUpdate] = useState<Mission | null>(null)
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    fetchMissions()
  }, [])

  const fetchMissions = async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const result = await response.json()
        // Handle both old array format and new paginated format
        const data = Array.isArray(result) ? result : result.data || []
        // Show only the most recent missions for dashboard
        setMissions(data.slice(0, DASHBOARD_ITEMS_LIMIT))
      }
    } catch (error) {
      console.error("Error fetching missions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (mission: Mission) => {
    setMissionToDelete(mission)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!missionToDelete) return

    try {
      const response = await fetch(`/api/orders/${missionToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMissions(missions => missions.filter(mission => mission.id !== missionToDelete.id))
        setDeleteDialogOpen(false)
        setMissionToDelete(null)
      } else {
        console.error('Failed to delete mission')
      }
    } catch (error) {
      console.error('Error deleting mission:', error)
    }
  }

  const handleStatusUpdateClick = (mission: Mission) => {
    setMissionToUpdate(mission)
    setNewStatus(mission.status)
    setStatusDialogOpen(true)
  }

  const handleStatusUpdateConfirm = async () => {
    if (!missionToUpdate || !newStatus) return

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
    }
  }

  const handleViewDetails = (mission: Mission) => {
    router.push(`/deliveries/${mission.id}`)
  }

  if (loading) {
    return <TableSkeleton />
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
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
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
                  <SelectItem value="unassigned">ללא הקצאה</SelectItem>
                  <SelectItem value="waiting">ממתין</SelectItem>
                  <SelectItem value="in_progress">בדרך</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                  <SelectItem value="problem">בעיה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleStatusUpdateConfirm}>
              עדכן סטטוס
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מזהה</TableHead>
              <TableHead className="text-right">סוג משימה</TableHead>
              <TableHead className="text-right">כתובת</TableHead>
              <TableHead className="text-right">תעודות</TableHead>
              <TableHead className="text-right w-24">סטטוס</TableHead>
              <TableHead className="text-right hidden sm:table-cell">תאריך צפוי</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((mission) => (
              <TableRow key={mission.id} className="h-16">
                <TableCell className="text-right font-medium h-16">#{mission.id}</TableCell>
                <TableCell className="text-right h-16">
                  <div className="text-sm">
                    <div className="truncate max-w-24 sm:max-w-32">
                      {mission.type === "delivery" ? "משלוח" : mission.type === "pickup" ? "איסוף" : mission.type === "survey" ? "סקר" : mission.type === "manofeem" ? "מנופים" : mission.type}
                    </div>
                    {mission.subtype && (
                      <div className="text-muted-foreground truncate max-w-24 sm:max-w-32">{mission.subtype}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right h-16 max-w-32 sm:max-w-xs">
                  <div className="truncate">
                    {mission.address?.address ? `${mission.address.address}, ${mission.address.city}` : "לא צוין"}
                  </div>
                </TableCell>
                <TableCell className="text-right h-16">
                  {mission.certificates ? mission.certificates.length : 0}
                </TableCell>
                <TableCell className="text-right h-16 w-24">
                  <Badge
                    className={`${getStatusColor(mission.status)} px-2 py-1 text-xs whitespace-nowrap w-full justify-center cursor-pointer transition-colors`}
                  >
                    {getStatusText(mission.status)}
                  </Badge>
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
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(mission)}>
                        <Eye className="mr-2 h-4 w-4" /> צפה בפרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusUpdateClick(mission)}>
                        <Edit className="mr-2 h-4 w-4" /> עדכן סטטוס
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                        onClick={() => handleDeleteClick(mission)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> מחק משימה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {/* Fill empty rows to maintain consistent height */}
            {missions.length < DASHBOARD_ITEMS_LIMIT &&
              Array.from({ length: DASHBOARD_ITEMS_LIMIT - missions.length }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-16">
                  <TableCell className="h-16" colSpan={7}>
                    &nbsp;
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center pt-4">
        <Button variant="outline" asChild>
          <Link href="/deliveries">צפה בכל המשלוחים</Link>
        </Button>
      </div>
    </div>
    </>
  )
}