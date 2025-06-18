"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Eye, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface Order {
  id: number
  customer_id: string
  client_name: string | null
  client_phone: string | null
  address: string
  packages_count: number
  driver: string | null
  car_number: string | null
  status: "unassigned" | "waiting" | "in_progress" | "completed" | "problem"
  time_delivered: string | null
  created_at: string
  updated_at: string
  metadata?: any
}

const ITEMS_PER_PAGE = 15

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
            <TableHead className="text-right">מזהה לקוח</TableHead>
            <TableHead className="text-right">לקוח</TableHead>
            <TableHead className="text-right">כתובת</TableHead>
            <TableHead className="text-right">חבילות</TableHead>
            <TableHead className="text-right hidden md:table-cell">רכב</TableHead>
            <TableHead className="text-right w-24">סטטוס</TableHead>
            <TableHead className="text-right hidden lg:table-cell">זמן נמסר</TableHead>
            <TableHead className="text-right hidden sm:table-cell">זמן נוצר</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <TableRow key={i} className="h-16">
              <TableCell className="text-right h-16">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="text-right h-16">
                <Skeleton className="h-4 w-20" />
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
              <TableCell className="text-right h-16 hidden md:table-cell">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="text-right h-16 w-24">
                <Skeleton className="h-6 w-full rounded-full" />
              </TableCell>
              <TableCell className="text-right h-16 hidden lg:table-cell">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
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

interface DeliveriesTableProps {
  statusFilter?: string
  sortBy?: string
  sortOrder?: string
  searchQuery?: string
}

export function DeliveriesTable({ 
  statusFilter = "all", 
  sortBy = "created_at", 
  sortOrder = "desc", 
  searchQuery = "" 
}: DeliveriesTableProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, sortBy, sortOrder])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [statusFilter, sortBy, sortOrder, searchQuery])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        sortBy,
        sortOrder,
      })
      
      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <TableSkeleton />
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      order.id.toString().includes(searchLower) ||
      order.customer_id.toLowerCase().includes(searchLower) ||
      order.client_name?.toLowerCase().includes(searchLower) ||
      order.client_phone?.toLowerCase().includes(searchLower) ||
      order.address.toLowerCase().includes(searchLower) ||
      order.driver?.toLowerCase().includes(searchLower) ||
      order.car_number?.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const currentOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return

    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove the deleted order from state
        setOrders(orders => orders.filter(order => order.id !== orderToDelete.id))
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
      } else {
        console.error('Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
    }
  }

  const handleStatusUpdateClick = (order: Order) => {
    setOrderToUpdate(order)
    setNewStatus(order.status)
    setStatusDialogOpen(true)
  }

  const handleStatusUpdateConfirm = async () => {
    if (!orderToUpdate || !newStatus) return

    try {
      const response = await fetch(`/api/orders/${orderToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderToUpdate,
          status: newStatus,
          time_delivered: newStatus === 'completed' && !orderToUpdate.time_delivered 
            ? new Date().toISOString() 
            : orderToUpdate.time_delivered,
        }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        // Update the order in state
        setOrders(orders => orders.map(order => 
          order.id === orderToUpdate.id ? updatedOrder : order
        ))
        setStatusDialogOpen(false)
        setOrderToUpdate(null)
        setNewStatus("")
      } else {
        console.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleViewDetails = (order: Order) => {
    router.push(`/deliveries/${order.id}`)
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת משלוח</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את משלוח #{orderToDelete?.id}?
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
            <DialogTitle className="text-right">עדכון סטטוס משלוח</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                משלוח #{orderToUpdate?.id} - {orderToUpdate?.customer_id}
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
              <TableHead className="text-right">מזהה לקוח</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right">כתובת</TableHead>
              <TableHead className="text-right">חבילות</TableHead>
              <TableHead className="text-right hidden md:table-cell">רכב</TableHead>
              <TableHead className="text-right w-24">סטטוס</TableHead>
              <TableHead className="text-right hidden lg:table-cell">זמן נמסר</TableHead>
              <TableHead className="text-right hidden sm:table-cell">זמן נוצר</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <TableRow key={order.id} className="h-16">
                <TableCell className="text-right font-medium h-16">#{order.id}</TableCell>
                <TableCell className="text-right font-medium h-16 text-primary">
                  <div className="text-sm font-mono">{order.customer_id}</div>
                </TableCell>
                <TableCell className="text-right h-16">
                  <div className="text-sm">
                    <div className="truncate max-w-24 sm:max-w-32">
                      {order.client_name || <span className="text-muted-foreground">לא צוין</span>}
                    </div>
                    {order.client_phone && (
                      <div className="text-muted-foreground truncate max-w-24 sm:max-w-32">{order.client_phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right h-16 max-w-32 sm:max-w-xs">
                  <div className="truncate">{order.address}</div>
                </TableCell>
                <TableCell className="text-right h-16">{order.packages_count}</TableCell>
                <TableCell className="text-right h-16 hidden md:table-cell">
                  {order.car_number || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-right h-16 w-24">
                  <Badge
                    className={`${getStatusColor(order.status)} px-2 py-1 text-xs whitespace-nowrap w-full justify-center`}
                  >
                    {getStatusText(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right h-16 hidden lg:table-cell">
                  {order.time_delivered ? (
                    <div className="text-sm">
                      <div>{formatDate(order.time_delivered)}</div>
                      <div className="text-muted-foreground">{formatTime(order.time_delivered)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right h-16 hidden sm:table-cell">
                  <div className="text-sm">
                    <div>{formatDate(order.created_at)}</div>
                    <div className="text-muted-foreground">{formatTime(order.created_at)}</div>
                  </div>
                </TableCell>
                <TableCell className="h-16">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                        <Eye className="mr-2 h-4 w-4" /> צפה בפרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusUpdateClick(order)}>
                        <Edit className="mr-2 h-4 w-4" /> עדכן סטטוס
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => handleDeleteClick(order)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> מחק משלוח
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {/* Fill empty rows to maintain consistent height */}
            {currentOrders.length < ITEMS_PER_PAGE &&
              Array.from({ length: ITEMS_PER_PAGE - currentOrders.length }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-16">
                  <TableCell className="h-16" colSpan={10}>
                    &nbsp;
                  </TableCell>
                </TableRow>
              ))}
            
            {/* Show no results message if filtered orders is empty */}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell className="h-32 text-center" colSpan={10}>
                  <div className="text-muted-foreground">
                    {searchQuery ? "לא נמצאו תוצאות חיפוש" : "אין משלוחים להציג"}
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
