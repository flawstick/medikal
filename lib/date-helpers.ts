// Date and time formatting utilities for Hebrew locale

export function formatDate(dateString: string | null): string {
  if (!dateString) return "-"
  
  try {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}

export function formatTime(dateString: string | null): string {
  if (!dateString) return "-"
  
  try {
    return new Date(dateString).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting time:", error)
    return "-"
  }
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-"
  
  try {
    return new Date(dateString).toLocaleString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "-"
  }
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "-"
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 60) {
      return `לפני ${diffMinutes} דקות`
    } else if (diffHours < 24) {
      return `לפני ${diffHours} שעות`
    } else if (diffDays < 30) {
      return `לפני ${diffDays} ימים`
    } else {
      return formatDate(dateString)
    }
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return "-"
  }
}

export function isToday(dateString: string | null): boolean {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  } catch (error) {
    return false
  }
}

export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    return date < now
  } catch (error) {
    return false
  }
}

export function getDaysUntil(dateString: string | null): number | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  } catch (error) {
    return null
  }
}

export function getStartOfDay(date: Date = new Date()): Date {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  return startOfDay
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const startOfWeek = new Date(date)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

// Convert Date to date input format without timezone conversion (date only, no time)
export function toDateLocalString(date: Date | string | null): string {
  if (!date) return ""
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    
    // Use local timezone values directly instead of converting to UTC
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error converting to date string:", error)
    return ""
  }
}

// Convert date input value to ISO string for API (sets time to start of day)
export function fromDateLocalString(dateValue: string): string {
  if (!dateValue) return ""
  
  try {
    // Create date from input date and set to start of day UTC
    const date = new Date(dateValue + 'T00:00:00Z')
    return date.toISOString()
  } catch (error) {
    console.error("Error converting from date string:", error)
    return ""
  }
}