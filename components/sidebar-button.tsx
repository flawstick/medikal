"use client"

import * as React from "react"
import { ArrowLeftToLine } from "lucide-react"
import { motion } from "framer-motion"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export function SidebarButton() {
  const { open, setOpen } = useSidebar()

  // Handle keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        setOpen(!open)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(!open)}>
            <motion.div
              initial={false}
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: "tween", duration: 0.2 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ArrowLeftToLine size={16} />
            </motion.div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" align="center">
          <p>פתח/סגור (⌘B)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
