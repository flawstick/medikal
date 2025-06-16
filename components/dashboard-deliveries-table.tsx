"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface Order {
  id: number
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
}

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
            <TableHead className="text-right">לקוח</TableHead>
            <TableHead className="text-right">כתובת</TableHead>
            <TableHead className="text-right">חבילות</TableHead>
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        // Show only the most recent orders for dashboard
        setOrders(data.slice(0, DASHBOARD_ITEMS_LIMIT))
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

  return (
    <div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מזהה</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right">כתובת</TableHead>
              <TableHead className="text-right">חבילות</TableHead>
              <TableHead className="text-right w-24">סטטוס</TableHead>
              <TableHead className="text-right hidden sm:table-cell">זמן נוצר</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="h-16">
                <TableCell className="text-right font-medium h-16">#{order.id}</TableCell>
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
                <TableCell className="text-right h-16 w-24">
                  <Badge
                    className={`${getStatusColor(order.status)} px-2 py-1 text-xs whitespace-nowrap w-full justify-center`}
                  >
                    {getStatusText(order.status)}
                  </Badge>
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> צפה בפרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem>עדכן סטטוס</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {/* Fill empty rows to maintain consistent height */}
            {orders.length < DASHBOARD_ITEMS_LIMIT &&
              Array.from({ length: DASHBOARD_ITEMS_LIMIT - orders.length }).map((_, index) => (
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
  )
}