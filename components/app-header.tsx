import { Button } from "@/components/ui/button"
import { HeaderDatePicker } from "@/components/header-date-picker"
import { Plus } from "lucide-react"
import Link from "next/link"

export function AppHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Button size="default" asChild>
            <Link href="/upload">
              <Plus className="ml-2 h-4 w-4" />
              הזמנה חדשה
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderDatePicker />
        </div>
      </div>
    </header>
  )
}