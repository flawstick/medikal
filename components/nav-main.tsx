"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [activeRect, setActiveRect] = useState<DOMRect | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeButton = menuRef.current?.querySelector('[data-active="true"]');
    if (activeButton) {
      const rect = activeButton.getBoundingClientRect();
      const menuRect = menuRef.current!.getBoundingClientRect();
      setActiveRect({
        ...rect,
        top: rect.top - menuRect.top,
        left: rect.left - menuRect.left,
      } as DOMRect);
    }
  }, [pathname]);

  return (
    <SidebarMenu ref={menuRef} className="relative">
      {activeRect && (
        <div
          className="absolute rounded-md transition-all duration-300 ease-in-out pointer-events-none shadow-sm ring-1 ring-primary/20"
          style={{
            width: activeRect.width,
            height: activeRect.height,
            transform: `translate(${activeRect.left}px, ${activeRect.top}px)`,
            background:
              "linear-gradient(135deg, hsl(var(--primary)/0.16), hsl(var(--primary)/0.08))",
            backdropFilter: "saturate(140%) blur(2px)",
          }}
        />
      )}
      {items.map((item) => {
        // Check if this item or any of its sub-items is active
        const isItemActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
        const hasActiveSubItem = item.items?.some(subItem => 
          subItem.url === "/deliveries" && pathname === "/upload" ? true :
          subItem.url === "/car-reports" && pathname.startsWith("/car-reports") ? true :
          pathname.startsWith(subItem.url)
        );
        const isActive = isItemActive || hasActiveSubItem;

        // If item has sub-items, render as collapsible
        if (item.items) {
          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`
                      justify-start text-right relative z-10 transition-colors
                      hover:bg-muted/60 hover:text-foreground
                      ${isActive ? "bg-primary text-primary-foreground" : "text-foreground/90"}
                    `}
                  >
                    <item.icon className={`size-4 ${isActive ? "text-primary-foreground" : "text-foreground/70"}`} />
                    <span className={isActive ? "font-medium" : ""}>{item.title}</span>
                    <ChevronRight className="mr-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const isSubActive = 
                        subItem.url === "/deliveries" && pathname === "/upload" ? true :
                        subItem.url === "/car-reports" && pathname.startsWith("/car-reports") ? true :
                        pathname.startsWith(subItem.url);
                      
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={isSubActive}
                            className="text-right hover:bg-muted/60"
                          >
                            <a href={subItem.url}>
                              <span className={isSubActive ? "font-medium" : ""}>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        // Regular item without sub-items
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
              className={`
                justify-start text-right relative z-10 transition-colors
                hover:bg-muted/60 hover:text-foreground
                ${isActive ? "bg-primary text-primary-foreground" : "text-foreground/90"}
              `}
            >
              <a href={item.url} className="flex items-center gap-2">
                <item.icon className={`size-4 ${isActive ? "text-primary-foreground" : "text-foreground/70"}`} />
                <span className={isActive ? "font-medium" : ""}>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
