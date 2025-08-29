import { OrgProvider } from '@/components/org-provider'
import { getOrgIdFromParams } from '@/lib/org-utils'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgId: string }
}) {
  // Validate and normalize the orgId
  const { orgId } = await params
  const normalizedOrgId = getOrgIdFromParams(orgId)
  
  return (
    <OrgProvider>
      {children}
    </OrgProvider>
  )
}