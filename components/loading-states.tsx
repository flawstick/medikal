import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Loading spinner component
export function LoadingSpinner({ size = "default", text }: { size?: "sm" | "default" | "lg", text?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className="flex flex-col items-center justify-center p-4" role="status" aria-live="polite">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden="true" />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
      <span className="sr-only">טוען...</span>
    </div>
  )
}

// Loading skeleton for tables
export function TableLoadingSkeleton({ rows = 5, columns = 6 }: { rows?: number, columns?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="טוען נתוני טבלה">
      <div className="border rounded-lg overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-muted/30 p-4 border-b">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
        </div>
        
        {/* Rows skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 border-b last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">טוען נתוני טבלה...</span>
    </div>
  )
}

// Loading skeleton for cards
export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="טוען כרטיסי מידע">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">טוען כרטיסי מידע...</span>
    </div>
  )
}

// Loading skeleton for forms
export function FormLoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="טוען טופס">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <span className="sr-only">טוען טופס...</span>
    </div>
  )
}

// Page loading component
export function PageLoading({ text = "טוען עמוד..." }: { text?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-lg font-medium text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

// Inline loading component for buttons and small areas
export function InlineLoading({ text, className }: { text?: string, className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`} role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {text && <span className="text-sm">{text}</span>}
      <span className="sr-only">{text || "טוען..."}</span>
    </div>
  )
}