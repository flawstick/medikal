import { Button } from "@/components/ui/button"
import { HeaderDatePicker } from "@/components/header-date-picker"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { useState } from "react"

export function AppHeader() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // In a real app, you would fetch data here
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.5 }}>
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>רענן</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <HeaderDatePicker />
        </div>
      </div>
    </header>
  )
}