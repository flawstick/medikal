'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getCurrentOrgId, getDefaultOrgId } from '@/lib/org-utils'

interface OrgContextType {
  orgId: string
  setOrgId: (orgId: string) => void
  isDefault: boolean
}

const OrgContext = createContext<OrgContextType | undefined>(undefined)

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [orgId, setOrgIdState] = useState(() => getCurrentOrgId(pathname))
  
  const isDefault = orgId === getDefaultOrgId()

  // Update orgId when URL changes
  useEffect(() => {
    const newOrgId = getCurrentOrgId(pathname)
    setOrgIdState(newOrgId)
  }, [pathname])

  const setOrgId = (newOrgId: string) => {
    setOrgIdState(newOrgId)
    // Optionally navigate to new org URL
    // This would be handled by the component that calls setOrgId
  }

  return (
    <OrgContext.Provider value={{ orgId, setOrgId, isDefault }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider')
  }
  return context
}