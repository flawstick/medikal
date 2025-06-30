"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
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
          className="absolute bg-primary rounded-md transition-all duration-300 ease-in-out pointer-events-none"
          style={{
            width: activeRect.width,
            height: activeRect.height,
            transform: `translate(${activeRect.left}px, ${activeRect.top}px)`,
          }}
        />
      )}
      {items.map((item) => {
        const isActive =
          item.url === "/"
            ? pathname === "/"
            : item.url === "/deliveries" && pathname === "/upload"
              ? true
              : item.url === "/car-reports" && pathname.startsWith("/car-reports")
              ? true
              : pathname.startsWith(item.url);

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
              className={`
                justify-start text-right transition-colors relative z-10
                transition-opacity
                ${isActive
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted hover:text-foreground"}
              `}
            >
              <a href={item.url}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
