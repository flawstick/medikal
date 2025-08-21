import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getDefaultOrgId, isValidOrgId } from './lib/org-utils'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Handle root redirect to default org
  if (pathname === '/') {
    const defaultOrgId = getDefaultOrgId()
    return NextResponse.redirect(new URL(`/${defaultOrgId}`, req.url))
  }

  // Check if this is an org-specific route
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  
  // If first segment looks like an orgId, it's an org route
  const isOrgRoute = firstSegment && isValidOrgId(firstSegment)
  
  // Protected routes (both org-specific and legacy)
  const protectedPaths = [
    '/deliveries',
    '/drivers', 
    '/cars',
    '/reports',
    '/car-reports',
    '/upload',
    '/settings',
    '/profile'
  ]

  // Check if this is a protected path (either /orgId/path or legacy /path)
  let isProtectedPath = false
  
  if (isOrgRoute) {
    // For org routes, check if the path after orgId is protected
    const pathAfterOrg = '/' + segments.slice(1).join('/')
    isProtectedPath = pathAfterOrg === '/' || protectedPaths.some(path => 
      pathAfterOrg === path || pathAfterOrg.startsWith(`${path}/`)
    )
  } else {
    // For legacy routes, check directly
    isProtectedPath = protectedPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    )
    
    // If it's a legacy protected route, redirect to org-specific version
    if (isProtectedPath && session) {
      const defaultOrgId = getDefaultOrgId()
      return NextResponse.redirect(new URL(`/${defaultOrgId}${pathname}`, req.url))
    }
  }

  // Auth routes that should redirect if already logged in
  const authPaths = ['/login', '/auth/signin']
  const isAuthPath = authPaths.some(path => pathname === path)

  // If user is not logged in and trying to access protected route
  if (!session && isProtectedPath) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access auth pages
  if (session && isAuthPath) {
    const defaultOrgId = getDefaultOrgId()
    return NextResponse.redirect(new URL(`/${defaultOrgId}`, req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}