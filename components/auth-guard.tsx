"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthGuardProps {
  children: React.ReactNode
}

const publicRoutes = ["/auth/signin", "/auth/error"]

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "loading") return // Still loading

    const isPublicRoute = publicRoutes.includes(pathname)

    if (!session && !isPublicRoute) {
      // Not authenticated and trying to access private route
      router.push("/auth/signin")
      return
    }

    if (session && isPublicRoute) {
      // Authenticated but on public route, redirect to home
      router.push("/")
      return
    }
  }, [session, status, pathname, router])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  // Show children if authenticated or on public route
  const isPublicRoute = publicRoutes.includes(pathname)
  if (session || isPublicRoute) {
    return <>{children}</>
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">מעביר לעמוד התחברות...</div>
    </div>
  )
}