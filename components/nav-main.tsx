"use client"

import type { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
              className={`
                justify-start text-right transition-colors
                hover:bg-muted hover:text-foreground
                data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
                ${isActive ? "bg-primary text-primary-foreground" : ""}
              `}
            >
              <a href={item.url}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
