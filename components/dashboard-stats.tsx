"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Truck, CheckCircle, Clock, TrendingUp, AlertTriangle, Timer, Users } from "lucide-react"

interface Mission {
  id: number
  type: string
  subtype: string | null
  address: {
    address: string
    city: string
    zip_code: string
  }
  driver: string | null
  car_number: string | null
  status: "unassigned" | "waiting" | "in_progress" | "completed" | "problem"
  date_expected: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  certificates: any[] | null
  metadata?: any
}

interface AnalyticsData {
  todayCompletions: number
  activeMissions: number
  completedThisMonth: number
  activeVehicles: number
  successRate: number
  problemRate: number
  avgCompletionDays: number
  totalDeliveries: number
  totalManofeem: number
  totalCertificates: number
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
        const missions: Mission[] = await response.json()
        const analyticsData = calculateAnalytics(missions)
        setAnalytics(analyticsData)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (missions: Mission[]): AnalyticsData => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Today's completions (completed today)
    const todayCompletions = missions.filter(
      (mission) => mission.completed_at && new Date(mission.completed_at) >= startOfToday,
    ).length

    // Active missions (in progress + waiting)
    const activeMissions = missions.filter(
      (mission) => mission.status === "in_progress" || mission.status === "waiting",
    ).length

    // Completed this month
    const completedThisMonth = missions.filter(
      (mission) => mission.status === "completed" && new Date(mission.created_at) >= startOfMonth,
    ).length

    // Active vehicles (unique car numbers with active missions)
    const activeVehicles = new Set(
      missions
        .filter((mission) => mission.car_number && (mission.status === "in_progress" || mission.status === "waiting"))
        .map((mission) => mission.car_number),
    ).size

    // Success rate (completed vs total assigned missions)
    const assignedMissions = missions.filter((mission) => mission.status !== "unassigned")
    const completedMissions = missions.filter((mission) => mission.status === "completed")
    const successRate =
      assignedMissions.length > 0 ? Math.round((completedMissions.length / assignedMissions.length) * 100) : 0

    // Problem rate
    const problemMissions = missions.filter((mission) => mission.status === "problem")
    const problemRate = assignedMissions.length > 0 ? Math.round((problemMissions.length / assignedMissions.length) * 100) : 0

    // Average completion time (from creation to completion in days)
    const completedMissionsWithTime = missions.filter((mission) => mission.completed_at && mission.created_at)
    const totalCompletionTime = completedMissionsWithTime.reduce((sum, mission) => {
      const created = new Date(mission.created_at).getTime()
      const completed = new Date(mission.completed_at!).getTime()
      return sum + (completed - created)
    }, 0)
    const avgCompletionDays =
      completedMissionsWithTime.length > 0
        ? Math.round((totalCompletionTime / completedMissionsWithTime.length / (1000 * 60 * 60 * 24)) * 10) / 10
        : 0

    // Mission type counts
    const totalDeliveries = missions.filter((mission) => mission.type === "delivery").length
    const totalManofeem = missions.filter((mission) => mission.type === "manofeem").length

    // Total certificates
    const totalCertificates = missions.reduce((sum, mission) => {
      return sum + (mission.certificates?.length || 0)
    }, 0)

    return {
      todayCompletions,
      activeMissions,
      completedThisMonth,
      activeVehicles,
      successRate,
      problemRate,
      avgCompletionDays,
      totalDeliveries,
      totalManofeem,
      totalCertificates,
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
      title: "הושלמו היום",
      value: analytics.todayCompletions,
      suffix: "",
      description: "משימות שהושלמו היום",
      icon: CheckCircle,
    },
    {
      title: "משימות פעילות",
      value: analytics.activeMissions,
      suffix: "",
      description: "משימות בדרך וממתינות",
      icon: Clock,
    },
    {
      title: "הושלמו החודש",
      value: analytics.completedThisMonth,
      suffix: "",
      description: "משימות שהושלמו החודש",
      icon: TrendingUp,
    },
    {
      title: "רכבים פעילים",
      value: analytics.activeVehicles,
      suffix: "",
      description: "רכבים עם משימות פעילות",
      icon: Truck,
    },
    {
      title: "משלוחים",
      value: analytics.totalDeliveries,
      suffix: "",
      description: "סה״כ משימות משלוח",
      icon: Package,
    },
    {
      title: "מנופים",
      value: analytics.totalManofeem,
      suffix: "",
      description: "סה״כ משימות מנופים",
      icon: Users,
    },
    {
      title: "תעודות משלוח",
      value: analytics.totalCertificates,
      suffix: "",
      description: "סה״כ תעודות משלוח",
      icon: AlertTriangle,
    },
    {
      title: "זמן השלמה ממוצע",
      value: analytics.avgCompletionDays,
      suffix: " ימים",
      description: "מיצירה ועד להשלמה",
      icon: Timer,
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
