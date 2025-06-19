"use client"

import { useState } from "react"
import { DeliveriesTable } from "@/components/deliveries-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import Link from "next/link"

export default function DeliveriesPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [searchQuery, setSearchQuery] = useState("")

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
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-right text-xl">כל המשלוחים</CardTitle>
            {(statusFilter !== "all" || searchQuery) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>מסננים פעילים:</span>
                {statusFilter !== "all" && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                    סטטוס: {statusFilter === "unassigned" ? "ללא הקצאה" : 
                             statusFilter === "waiting" ? "ממתין" :
                             statusFilter === "in_progress" ? "בדרך" :
                             statusFilter === "completed" ? "הושלם" : "בעיה"}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-1 bg-primary/10 rounded text-primary text-xs">
                    חיפוש: "{searchQuery}"
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xs order-3 md:order-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="חפש משלוחים..." 
                className="pr-10 text-right"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex gap-2 order-1 md:order-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="hover:bg-transparent hover:text-foreground">כל הסטטוסים</SelectItem>
                  <SelectItem value="unassigned" className="hover:bg-transparent hover:text-foreground">ללא הקצאה</SelectItem>
                  <SelectItem value="waiting" className="hover:bg-transparent hover:text-foreground">ממתין</SelectItem>
                  <SelectItem value="in_progress" className="hover:bg-transparent hover:text-foreground">בדרך</SelectItem>
                  <SelectItem value="completed" className="hover:bg-transparent hover:text-foreground">הושלם</SelectItem>
                  <SelectItem value="problem" className="hover:bg-transparent hover:text-foreground">בעיה</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at" className="hover:bg-transparent hover:text-foreground">תאריך יצירה</SelectItem>
                  <SelectItem value="updated_at" className="hover:bg-transparent hover:text-foreground">עדכון אחרון</SelectItem>
                  <SelectItem value="time_delivered" className="hover:bg-transparent hover:text-foreground">זמן משלוח</SelectItem>
                  <SelectItem value="id" className="hover:bg-transparent hover:text-foreground">מספר משלוח</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc" className="hover:bg-transparent hover:text-foreground">חדש לישן</SelectItem>
                  <SelectItem value="asc" className="hover:bg-transparent hover:text-foreground">ישן לחדש</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DeliveriesTable 
            statusFilter={statusFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchQuery={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  )
}
