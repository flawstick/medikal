"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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

interface ChartData {
  date: string
  completed: number
  pending: number
}

const transformOrdersToChartData = (orders: Order[]): ChartData[] => {
  const dataMap = new Map<string, { completed: number; pending: number }>()

  orders.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split("T")[0]
    
    if (!dataMap.has(date)) {
      dataMap.set(date, { completed: 0, pending: 0 })
    }

    const dayData = dataMap.get(date)!
    
    if (order.status === "completed") {
      dayData.completed += 1
    } else if (["unassigned", "waiting", "in_progress"].includes(order.status)) {
      dayData.pending += 1
    }
  })

  return Array.from(dataMap.entries())
    .map(([date, data]) => ({
      date,
      completed: data.completed,
      pending: data.pending,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const chartConfig = {
  deliveries: {
    label: "משלוחים",
  },
  completed: {
    label: "הושלמו",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "ממתינים",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

export function DeliveryAnalyticsChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/orders')
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        
        const orders: Order[] = await response.json()
        const transformedData = transformOrdersToChartData(orders)
        setChartData(transformedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredData = React.useMemo(() => {
    return chartData.filter((item) => {
      const date = new Date(item.date)
      const referenceDate = new Date()
      let daysToSubtract = 30
      if (timeRange === "90d") {
        daysToSubtract = 90
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }
      const startDate = new Date(referenceDate)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }, [chartData, timeRange])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">מגמות משלוחים</CardTitle>
          <CardDescription className="text-right">טוען נתונים...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-muted-foreground">טוען נתונים...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">מגמות משלוחים</CardTitle>
          <CardDescription className="text-right">שגיאה בטעינת הנתונים</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">מגמות משלוחים</CardTitle>
        <CardDescription className="text-right">
          <span className="hidden sm:block">
            משלוחים שהושלמו וממתינים ב-{timeRange === "7d" ? "7 הימים" : timeRange === "30d" ? "30 הימים" : "90 הימים"}{" "}
            האחרונים
          </span>
          <span className="sm:hidden">
            {timeRange === "7d" ? "7 ימים" : timeRange === "30d" ? "30 ימים" : "90 ימים"} אחרונים
          </span>
        </CardDescription>
        <div className="flex justify-end">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="7d">7 ימים</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 ימים</ToggleGroupItem>
            <ToggleGroupItem value="90d">90 ימים</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="flex w-32 sm:hidden" size="sm" aria-label="בחר טווח זמן">
              <SelectValue placeholder="30 ימים" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                7 ימים
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 ימים
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                90 ימים
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-muted-foreground">אין נתונים להצגה</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-completed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-completed)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("he-IL", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("he-IL", {
                        month: "long",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="pending"
                type="monotone"
                fill="url(#fillPending)"
                stroke="var(--color-pending)"
                stackId="a"
              />
              <Area
                dataKey="completed"
                type="monotone"
                fill="url(#fillCompleted)"
                stroke="var(--color-completed)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
