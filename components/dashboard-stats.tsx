"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Truck, CheckCircle, Clock, TrendingUp, AlertTriangle, Timer, Users } from "lucide-react"

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

interface AnalyticsData {
  todayDeliveries: number
  activeDeliveries: number
  completedThisMonth: number
  activeVehicles: number
  successRate: number
  problemRate: number
  avgDeliveryDays: number
  totalPackages: number
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / 1000, 1) // 1 second duration

      // Ease out animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(easeOut * value)
      
      setDisplayValue(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value])

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardStats() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const orders: Order[] = await response.json()
        const analyticsData = calculateAnalytics(orders)
        setAnalytics(analyticsData)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (orders: Order[]): AnalyticsData => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Today's deliveries (completed today)
    const todayDeliveries = orders.filter(
      (order) => order.time_delivered && new Date(order.time_delivered) >= startOfToday,
    ).length

    // Active deliveries (in progress + waiting)
    const activeDeliveries = orders.filter(
      (order) => order.status === "in_progress" || order.status === "waiting",
    ).length

    // Completed this month
    const completedThisMonth = orders.filter(
      (order) => order.status === "completed" && new Date(order.created_at) >= startOfMonth,
    ).length

    // Active vehicles (unique car numbers with active orders)
    const activeVehicles = new Set(
      orders
        .filter((order) => order.car_number && (order.status === "in_progress" || order.status === "waiting"))
        .map((order) => order.car_number),
    ).size

    // Success rate (completed vs total assigned orders)
    const assignedOrders = orders.filter((order) => order.status !== "unassigned")
    const completedOrders = orders.filter((order) => order.status === "completed")
    const successRate =
      assignedOrders.length > 0 ? Math.round((completedOrders.length / assignedOrders.length) * 100) : 0

    // Problem rate
    const problemOrders = orders.filter((order) => order.status === "problem")
    const problemRate = assignedOrders.length > 0 ? Math.round((problemOrders.length / assignedOrders.length) * 100) : 0

    // Average delivery time (from creation to delivery in days)
    const deliveredOrders = orders.filter((order) => order.time_delivered && order.created_at)
    const totalDeliveryTime = deliveredOrders.reduce((sum, order) => {
      const created = new Date(order.created_at).getTime()
      const delivered = new Date(order.time_delivered!).getTime()
      return sum + (delivered - created)
    }, 0)
    const avgDeliveryDays =
      deliveredOrders.length > 0
        ? Math.round((totalDeliveryTime / deliveredOrders.length / (1000 * 60 * 60 * 24)) * 10) / 10
        : 0

    // Total packages handled
    const totalPackages = orders.reduce((sum, order) => sum + order.packages_count, 0)

    return {
      todayDeliveries,
      activeDeliveries,
      completedThisMonth,
      activeVehicles,
      successRate,
      problemRate,
      avgDeliveryDays,
      totalPackages,
    }
  }

  if (loading) {
    return <StatsSkeleton />
  }

  if (!analytics) {
    return <div>שגיאה בטעינת הנתונים</div>
  }

  const stats = [
    {
      title: "משלוחים היום",
      value: analytics.todayDeliveries,
      suffix: "",
      description: "משלוחים שהושלמו היום",
      icon: Package,
    },
    {
      title: "משלוחים פעילים",
      value: analytics.activeDeliveries,
      suffix: "",
      description: "משלוחים בדרך וממתינים",
      icon: Clock,
    },
    {
      title: "הושלמו החודש",
      value: analytics.completedThisMonth,
      suffix: "",
      description: "משלוחים שהושלמו החודש",
      icon: CheckCircle,
    },
    {
      title: "רכבים פעילים",
      value: analytics.activeVehicles,
      suffix: "",
      description: "רכבים עם משלוחים פעילים",
      icon: Truck,
    },
    {
      title: "אחוז הצלחה",
      value: analytics.successRate,
      suffix: "%",
      description: "משלוחים שהושלמו בהצלחה",
      icon: TrendingUp,
    },
    {
      title: "אחוז בעיות",
      value: analytics.problemRate,
      suffix: "%",
      description: "משלוחים עם בעיות",
      icon: AlertTriangle,
    },
    {
      title: "זמן משלוח ממוצע",
      value: analytics.avgDeliveryDays,
      suffix: " ימים",
      description: "מיצירה ועד למסירה",
      icon: Timer,
    },
    {
      title: "סה״כ חבילות",
      value: analytics.totalPackages,
      suffix: "",
      description: "חבילות בכל המשלוחים",
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="text-xs text-muted-foreground text-right">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
