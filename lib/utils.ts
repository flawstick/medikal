import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Role-based access control utilities
export type UserRole = 'operator' | 'manager' | 'admin'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  operator: 1,
  manager: 2,
  admin: 3,
}

export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  console.log('hasRole called with:', { userRole, requiredRole })

  if (!userRole) {
    console.log('hasRole: userRole is falsy')
    return false
  }

  const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole]
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]

  console.log('hasRole levels:', { userRoleLevel, requiredRoleLevel })

  if (userRoleLevel === undefined) {
    console.log('hasRole: userRole not found in hierarchy')
    return false
  }

  const result = userRoleLevel >= requiredRoleLevel
  console.log('hasRole result:', result)

  return result
}

export function canCreateUsers(userRole: string | undefined): boolean {
  console.log('canCreateUsers called with role:', userRole)
  const result = hasRole(userRole, 'manager')
  console.log('canCreateUsers result:', result)
  return result
}

export function canManageUsers(userRole: string | undefined): boolean {
  return hasRole(userRole, 'admin')
}

export function canAccessAdminPanel(userRole: string | undefined): boolean {
  return hasRole(userRole, 'manager')
}
