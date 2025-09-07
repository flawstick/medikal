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
                justify-start text-right relative z-10 transition-colors
                hover:bg-muted/60 hover:text-foreground
                ${isActive ? "bg-muted/60 text-foreground" : "text-foreground/90"}
              `}
            >
              <a href={item.url} className="flex items-center gap-2">
                <item.icon className={`size-4 ${isActive ? "text-primary" : "text-foreground/70"}`} />
                <span className={isActive ? "font-medium" : ""}>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
