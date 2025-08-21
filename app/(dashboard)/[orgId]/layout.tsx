import { OrgProvider } from '@/components/org-provider'
import { getOrgIdFromParams } from '@/lib/org-utils'

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgId: string }
}) {
  // Validate and normalize the orgId
  const orgId = getOrgIdFromParams(params.orgId)
  
  return (
    <OrgProvider>
      {children}
    </OrgProvider>
  )
}