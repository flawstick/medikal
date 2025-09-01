"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

interface AuthGuardProps {
  children: React.ReactNode
}

const publicRoutes = ["/auth/login", "/auth/callback", "/auth/error"]

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = publicRoutes.includes(pathname)
      
      if (!user && !isPublicRoute) {
        router.push('/auth/login')
      }
      
      if (user && pathname === '/auth/login') {
        router.push('/')
      }
    }
  }, [user, loading, router, pathname])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Show nothing while redirecting
  const isPublicRoute = publicRoutes.includes(pathname)
  if (!user && !isPublicRoute) {
    return null
  }

  return <>{children}</>
}