"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getCurrentOrgId, isValidOrgId } from '@/lib/org-utils'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Organization {
  id: string
  name: string
  slug: string
}

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentOrgId, setCurrentOrgId] = React.useState(() => getCurrentOrgId(pathname))
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  // Load organizations from database
  React.useEffect(() => {
    async function loadOrganizations() {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .order('name')

        console.log('Organizations query result:', { data, error })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        if (data) {
          setOrganizations(data)
        }
      } catch (error) {
        console.error('Error loading organizations:', error)
        // Fallback to default org
        setOrganizations([{
          id: '1c595cc2-0e29-4b19-84f3-ab4ec61f655c',
          name: 'מדי-קל',
          slug: 'medikal'
        }])
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, [supabase])

  // Update current org when pathname changes
  React.useEffect(() => {
    const newOrgId = getCurrentOrgId(pathname)
    setCurrentOrgId(newOrgId)
  }, [pathname])

  const currentOrg = organizations.find(org => org.id === currentOrgId) || organizations[0]

  const handleOrgSwitch = (newOrgId: string) => {
    // Get current path after the orgId
    const segments = pathname.split('/').filter(Boolean)
    const isOrgRoute = segments[0] && isValidOrgId(segments[0])
    
    let newPath: string
    
    if (isOrgRoute) {
      // Remove current orgId and construct new path
      const pathAfterOrg = segments.slice(1).join('/')
      newPath = pathAfterOrg ? `/${newOrgId}/${pathAfterOrg}` : `/${newOrgId}`
      
      // Check if the path contains dynamic segments that might not exist in new org
      const hasDynamicSegments = pathAfterOrg.split('/').some(segment => {
        // Check for UUIDs or IDs that might be org-specific
        return /^[0-9a-f-]{36}$|^[0-9]+$/.test(segment)
      })
      
      if (hasDynamicSegments) {
        // For dynamic routes, go to the base page of that section
        const basePath = pathAfterOrg.split('/')[0]
        newPath = `/${newOrgId}/${basePath}`
      }
    } else {
      // For non-org routes, just add the org prefix
      newPath = `/${newOrgId}${pathname}`
    }
    
    router.push(newPath)
  }

  if (!activeTeam || loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
              <div className="size-4 bg-muted-foreground/20 rounded" />
            </div>
            <div className="grid flex-1 text-right text-sm leading-tight">
              <div className="h-4 bg-muted-foreground/20 rounded w-16" />
              <div className="h-3 bg-muted-foreground/10 rounded w-24 mt-1" />
            </div>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-medium">{currentOrg?.name || activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs text-right">
              ארגונים
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgSwitch(org.id)}
                className="gap-2 p-2 cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <activeTeam.logo className="size-3.5 shrink-0" />
                </div>
                <div className="flex flex-col items-end flex-1">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {org.slug}
                  </span>
                </div>
                {currentOrgId === org.id && (
                  <div className="size-2 rounded-full bg-primary ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">ארגון חדש</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}