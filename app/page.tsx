import { Suspense, lazy } from "react"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardDeliveriesTable } from "@/components/dashboard-deliveries-table"
import { HeaderDatePicker } from "@/components/header-date-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CardLoadingSkeleton } from "@/components/loading-states"

// Lazy load the chart component since it's heavy and not immediately visible
const DeliveryAnalyticsChart = lazy(() => 
  import("@/components/delivery-analytics-chart").then(module => ({
    default: module.DeliveryAnalyticsChart
  }))
)

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <HeaderDatePicker />
        <Button size="default" asChild>
          <Link href="/upload">
            <Plus className="ml-2 h-4 w-4" />
            הזמנה חדשה
          </Link>
        </Button>
      </div>

      <DashboardStats />

      <Suspense fallback={<CardLoadingSkeleton count={1} />}>
        <DeliveryAnalyticsChart />
      </Suspense>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-right">משלוחים אחרונים</CardTitle>
          <CardDescription className="text-right">רשימת המשלוחים האחרונים במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardDeliveriesTable />
        </CardContent>
      </Card>
    </div>
  )
}
