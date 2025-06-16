"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface HeaderDatePickerProps {
  onDateChange?: (date: Date | undefined) => void
}

export function HeaderDatePicker({ onDateChange }: HeaderDatePickerProps = {}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [value, setValue] = React.useState(formatDate(date))

  return (
    <div className="relative flex">
      <Input
        value={value}
        placeholder="בחר תאריך"
        className="bg-background pr-10 w-56 text-left"
        onChange={(e) => {
          setValue(e.target.value)
          // Try to parse the Hebrew date input
          const inputValue = e.target.value
          
          // Simple parsing for Hebrew dates or standard formats
          let parsedDate: Date | undefined
          
          if (inputValue) {
            // Try parsing as standard date first
            parsedDate = new Date(inputValue)
            
            // If that fails, try some common Hebrew patterns
            if (!isValidDate(parsedDate)) {
              // Replace Hebrew month names with English equivalents
              const hebrewToEnglish = inputValue
                .replace(/ינואר/g, 'January')
                .replace(/פברואר/g, 'February')
                .replace(/מרץ/g, 'March')
                .replace(/אפריל/g, 'April')
                .replace(/מאי/g, 'May')
                .replace(/יוני/g, 'June')
                .replace(/יולי/g, 'July')
                .replace(/אוגוסט/g, 'August')
                .replace(/ספטמבר/g, 'September')
                .replace(/אוקטובר/g, 'October')
                .replace(/נובמבר/g, 'November')
                .replace(/דצמבר/g, 'December')
              
              parsedDate = new Date(hebrewToEnglish)
            }
          }
          
          if (isValidDate(parsedDate)) {
            setDate(parsedDate)
            setMonth(parsedDate)
            onDateChange?.(parsedDate)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">בחר תאריך</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              setDate(date)
              setValue(formatDate(date))
              setOpen(false)
              onDateChange?.(date)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}