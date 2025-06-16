import { DeliveriesTable } from "@/components/deliveries-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-end gap-2 md:flex-row md:justify-between md:items-center">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">משלוחים</h1>
          <p className="text-muted-foreground mt-1">ניהול וצפייה בכל המשלוחים</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/upload">
            <Plus className="ml-2 h-5 w-5" />
            משלוח חדש
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        {" "}
        {/* Ensure shadow class */}
        <CardHeader className="flex flex-row items-center justify-between gap-4 !pb-4">
          {" "}
          {/* Improved header layout */}
          <CardTitle className="text-right text-xl">כל המשלוחים</CardTitle>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />{" "}
            {/* Adjusted for RTL */}
            <Input placeholder="חפש משלוחים..." className="pr-10 text-right" /> {/* Adjusted for RTL */}
          </div>
        </CardHeader>
        <CardContent>
          <DeliveriesTable />
        </CardContent>
      </Card>
    </div>
  )
}
