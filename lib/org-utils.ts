// Quick org utilities for client/server
const DEFAULT_ORG_ID = '1c595cc2-0e29-4b19-84f3-ab4ec61f655c' // medikal

// Get current org ID from URL or default to medikal
export function getCurrentOrgId(pathname?: string): string {
  if (typeof window !== 'undefined') {
    // Client side
    const segments = window.location.pathname.split('/')
    const orgIndex = segments.findIndex(segment => segment.length === 36 && segment.includes('-')) // UUID pattern
    return orgIndex !== -1 ? segments[orgIndex] : DEFAULT_ORG_ID
  } else if (pathname) {
    // Server side
    const segments = pathname.split('/')
    const orgIndex = segments.findIndex(segment => segment.length === 36 && segment.includes('-'))
    return orgIndex !== -1 ? segments[orgIndex] : DEFAULT_ORG_ID
  }
  return DEFAULT_ORG_ID
}

// Quick check if a string looks like a UUID
export function isValidOrgId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Get org ID from params (for dynamic routes)
export function getOrgIdFromParams(orgId: string | string[] | undefined): string {
  if (typeof orgId === 'string' && isValidOrgId(orgId)) {
    return orgId
  }
  return DEFAULT_ORG_ID
}

// Create URL with org ID
export function createOrgUrl(orgId: string, path: string): string {
  return `/${orgId}${path.startsWith('/') ? path : '/' + path}`
}

// Get default org ID
export function getDefaultOrgId(): string {
  return DEFAULT_ORG_ID
}

// For quick testing - you can override the org ID
let _testOrgId: string | null = null

export function setTestOrgId(orgId: string | null) {
  _testOrgId = orgId
}

export function getTestOrgId(): string | null {
  return _testOrgId
}

// Main function that respects test override
export function getActiveOrgId(pathname?: string): string {
  if (_testOrgId && isValidOrgId(_testOrgId)) {
    return _testOrgId
  }
  return getCurrentOrgId(pathname)
}