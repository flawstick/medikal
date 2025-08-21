import { NextRequest } from 'next/server'
import { getDefaultOrgId, isValidOrgId } from './org-utils'

// Extract orgId from request URL or headers
export function getOrgIdFromRequest(request: NextRequest): string {
  const defaultOrgId = getDefaultOrgId()
  
  // Try to get from URL pathname first
  const pathname = request.nextUrl.pathname
  const segments = pathname.split('/')
  
  // Look for UUID pattern in URL segments
  for (const segment of segments) {
    if (isValidOrgId(segment)) {
      return segment
    }
  }
  
  // Try to get from headers (for API calls)
  const headerOrgId = request.headers.get('x-org-id')
  if (headerOrgId && isValidOrgId(headerOrgId)) {
    return headerOrgId
  }
  
  // Try to get from query params
  const queryOrgId = request.nextUrl.searchParams.get('orgId')
  if (queryOrgId && isValidOrgId(queryOrgId)) {
    return queryOrgId
  }
  
  // Default to medikal org
  return defaultOrgId
}

// For use in API routes with params
export function getOrgIdFromParams(params: any): string {
  const defaultOrgId = getDefaultOrgId()
  
  if (params?.orgId && isValidOrgId(params.orgId)) {
    return params.orgId
  }
  
  return defaultOrgId
}

// Add orgId to API response headers for debugging
export function addOrgIdHeaders(headers: Headers, orgId: string) {
  headers.set('x-current-org-id', orgId)
  headers.set('x-is-default-org', (orgId === getDefaultOrgId()).toString())
}

// Supabase client with org filtering
export function createOrgFilteredQuery(orgId: string) {
  return {
    eq: (column: string, value: any) => ({ [column]: value, organization_id: orgId }),
    filter: { organization_id: orgId },
    orgId
  }
}