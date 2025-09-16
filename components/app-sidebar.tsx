"use client"

import type * as React from "react"
import { Home, PackageIcon, Moon, Sun, Monitor, Users, Car, Settings, FileText, UserCheck } from "lucide-react"
import { useTheme } from "next-themes"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"
import { BrandButton } from "@/components/brand-button"
import { SidebarButton } from "@/components/sidebar-button"
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

// Navigation data for Medi-Kal platform
const mediKalData = {
  navMain: [
    { title: "לוח בקרה", url: "/", icon: Home },
    { title: "משלוחים", url: "/deliveries", icon: PackageIcon },
    { title: "לקוחות", url: "/clients", icon: UserCheck },
    { title: "נהגים", url: "/drivers", icon: Users },
    { title: "רכבים", url: "/cars", icon: Car },
    { 
      title: "דוחות", 
      url: "#", 
      icon: FileText,
      items: [
        { title: "דוחות רכב", url: "/car-reports" },
      ]
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setTheme } = useTheme()

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
      <SidebarContent className="p-2">
        <NavMain items={mediKalData.navMain} />
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton className="justify-start text-right hover:bg-muted hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" />
                <span>הגדרות</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
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
