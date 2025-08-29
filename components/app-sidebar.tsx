"use client"

import type * as React from "react"
import { Home, PackageIcon, Moon, Sun, Monitor, Users, Car, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { getCurrentOrgId } from "@/lib/org-utils"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { BrandButton } from "@/components/brand-button"
import { SidebarButton } from "@/components/sidebar-button"
import { MedikalLogo } from "@/components/medikal-logo"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Create org-aware navigation data
function createMediKalData(orgId: string) {
  return {
    teams: [
      {
        name: "medi-קל",
        logo: MedikalLogo,
        plan: "מערכת ניהול משלוחים",
      },
    ],
    navMain: [
      { title: "דשבורד", url: `/${orgId}`, icon: Home },
      { title: "משימות", url: `/${orgId}/deliveries`, icon: PackageIcon },
      { title: "נהגים", url: `/${orgId}/drivers`, icon: Users },
      { title: "רכבים", url: `/${orgId}/cars`, icon: Car },
      { title: "דוחות רכב", url: `/${orgId}/car-reports`, icon: Car },
    ],
    navSecondary: [
      { title: "הגדרות", url: `/${orgId}/settings`, icon: Settings },
    ],
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setTheme } = useTheme()
  const pathname = usePathname()
  const orgId = getCurrentOrgId(pathname)
  const mediKalData = createMediKalData(orgId)

  return (
    <Sidebar side="right" collapsible="icon" className="bg-card group/sidebar" {...props}>
      <SidebarHeader className="h-14 p-2">
        <div className="flex w-full flex-row items-center justify-between">
          <div className="transition-opacity duration-200 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
            <BrandButton />
          </div>
          <SidebarButton />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 relative">
        <NavMain items={mediKalData.navMain} />
        
        {/* Secondary Navigation at the bottom of content */}
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <NavMain items={mediKalData.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="justify-start text-right hover:bg-muted hover:text-foreground transition-colors">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>ערכת נושא</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>בהיר</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>כהה</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>מערכת</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
