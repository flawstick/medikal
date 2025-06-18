"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Edit, Trash2, Calendar, Clock, Package, User, Phone, MapPin, Car, FileText } from "lucide-react"
import Link from "next/link"

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
}

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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return {
    date: date.toLocaleDateString("he-IL"),
    time: date.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [resolvedParams.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else if (response.status === 404) {
        setError("משלוח לא נמצא")
      } else {
        setError("שגיאה בטעינת המשלוח")
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      setError("שגיאה בטעינת המשלוח")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/deliveries">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזרה למשלוחים
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const createdDate = formatDateTime(order.created_at)
  const updatedDate = formatDateTime(order.updated_at)
  const deliveredDate = order.time_delivered ? formatDateTime(order.time_delivered) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">פרטי משלוח #{order.id}</h1>
          <p className="text-muted-foreground mt-1">מזהה לקוח: {order.customer_id}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/deliveries">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה למשלוחים
          </Link>
        </Button>
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className={`${getStatusColor(order.status)} px-3 py-1`}>
            {getStatusText(order.status)}
          </Badge>
          {deliveredDate && (
            <div className="text-sm text-muted-foreground">
              נמסר ב-{deliveredDate.date} בשעה {deliveredDate.time}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="ml-2 h-4 w-4" />
            עריכה
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600">
            <Trash2 className="ml-2 h-4 w-4" />
            מחיקה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטי לקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">שם לקוח:</span>
                <span className="font-medium">
                  {order.client_name || <span className="text-muted-foreground">לא צוין</span>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">טלפון:</span>
                <span className="font-medium">
                  {order.client_phone ? (
                    <a href={`tel:${order.client_phone}`} className="text-blue-600 hover:underline">
                      {order.client_phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">לא צוין</span>
                  )}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">כתובת:</span>
                <span className="font-medium text-right max-w-60">
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {order.address}
                  </a>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Package className="h-5 w-5" />
              פרטי משלוח
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">מספר חבילות:</span>
                <span className="font-medium">{order.packages_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">נהג:</span>
                <span className="font-medium">
                  {order.driver || <span className="text-muted-foreground">לא הוקצה</span>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">מספר רכב:</span>
                <span className="font-medium">
                  {order.car_number || <span className="text-muted-foreground">לא הוקצה</span>}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Clock className="h-5 w-5" />
              ציר זמן
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">משלוח נוצר</div>
                  <div className="text-sm text-muted-foreground">
                    {createdDate.date} בשעה {createdDate.time}
                  </div>
                </div>
              </div>
              
              {order.updated_at !== order.created_at && (
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">עדכון אחרון</div>
                    <div className="text-sm text-muted-foreground">
                      {updatedDate.date} בשעה {updatedDate.time}
                    </div>
                  </div>
                </div>
              )}

              {deliveredDate && (
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">משלוח הושלם</div>
                    <div className="text-sm text-muted-foreground">
                      {deliveredDate.date} בשעה {deliveredDate.time}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}