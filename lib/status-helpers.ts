import type { MissionStatus } from "@/lib/types"

// Status color mappings for UI components
export function getStatusColor(status: MissionStatus | string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
    case "in_progress":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
    case "waiting":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
    case "problem":
      return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
    case "unassigned":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  }
}

// Status text mappings for Hebrew UI
export function getStatusText(status: MissionStatus | string): string {
  switch (status) {
    case "completed":
      return "הושלם"
    case "in_progress":
      return "בדרך"
    case "waiting":
      return "ממתין"
    case "problem":
      return "בעיה"
    case "unassigned":
      return "ללא הקצאה"
    default:
      return status
  }
}

// Status priorities for sorting and filtering
export function getStatusPriority(status: MissionStatus | string): number {
  switch (status) {
    case "problem":
      return 1
    case "in_progress":
      return 2
    case "waiting":
      return 3
    case "unassigned":
      return 4
    case "completed":
      return 5
    default:
      return 6
  }
}

// Check if status indicates active mission
export function isActiveStatus(status: MissionStatus | string): boolean {
  return status === "in_progress" || status === "waiting"
}

// Check if status indicates completed mission
export function isCompletedStatus(status: MissionStatus | string): boolean {
  return status === "completed"
}

// Check if status indicates problem
export function isProblemStatus(status: MissionStatus | string): boolean {
  return status === "problem"
}

// Get all available statuses for dropdowns
export function getAllStatuses(): Array<{ value: MissionStatus; label: string }> {
  return [
    { value: "unassigned", label: getStatusText("unassigned") },
    { value: "waiting", label: getStatusText("waiting") },
    { value: "in_progress", label: getStatusText("in_progress") },
    { value: "completed", label: getStatusText("completed") },
    { value: "problem", label: getStatusText("problem") },
  ]
}