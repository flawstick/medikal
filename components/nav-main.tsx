"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const [indicatorStyles, setIndicatorStyles] = useState<{
    top: number;
    height: number;
  }>({ top: 0, height: 0 });

  const [activeBoxStyles, setActiveBoxStyles] = useState<{
    top: number;
    height: number;
  }>({ top: 0, height: 0 });

  const [lineStyles, setLineStyles] = useState<{
    top: number;
    height: number;
  }>({ top: 0, height: 0 });

  const [indicatorVisible, setIndicatorVisible] = useState(false);
  const [justActivated, setJustActivated] = useState(false);
  const [justRendered, setJustRendered] = useState(true);
  const [hasActiveItem, setHasActiveItem] = useState(false);
  const [lineVisible, setLineVisible] = useState(false);

  useEffect(() => {
    setJustRendered(false);
  }, []);

  function updateIndicator(index: number) {
    if (itemRefs.current[index] && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = itemRefs.current[index]!.getBoundingClientRect();
      setIndicatorStyles({
        top: itemRect.top - menuRect.top,
        height: itemRect.height,
      });
    }
  }

  function getActiveIndex() {
    return items.findIndex((item) => {
      // Extract the route segment from both pathname and item.url
      const pathSegments = pathname.split("/").filter(Boolean);
      const itemSegments = item.url.split("/").filter(Boolean);

      // For org root (like /orgId), check exact match
      if (itemSegments.length === 1 && pathSegments.length === 1) {
        return pathSegments[0] === itemSegments[0];
      }

      // For other routes, check if the last segment matches and orgId matches
      if (itemSegments.length >= 2 && pathSegments.length >= 2) {
        const orgIdMatches = pathSegments[0] === itemSegments[0];
        const routeMatches = pathSegments[1] === itemSegments[1];

        if (orgIdMatches && routeMatches) return true;

        // Special case: upload page should highlight deliveries
        if (
          orgIdMatches &&
          itemSegments[1] === "deliveries" &&
          pathSegments[1] === "upload"
        ) {
          return true;
        }
      }

      return false;
    });
  }

  // Function to recalculate all positions
  const recalculatePositions = () => {
    const activeIndex = getActiveIndex();
    if (
      activeIndex !== -1 &&
      itemRefs.current[activeIndex] &&
      menuRef.current
    ) {
      updateIndicator(activeIndex);
      // Update active box position
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = itemRefs.current[activeIndex]!.getBoundingClientRect();
      setActiveBoxStyles({
        top: itemRect.top - menuRect.top,
        height: itemRect.height,
      });
      // Update line position for active item
      setLineStyles({
        top: itemRect.top - menuRect.top + 8,
        height: itemRect.height - 16,
      });
      setHasActiveItem(true);
      setLineVisible(true);
      setIndicatorVisible(false);
      setJustActivated(true);
    } else {
      setHasActiveItem(false);
      setLineVisible(false);
      setIndicatorVisible(false);
      setJustActivated(false);
      setIndicatorStyles({ top: 0, height: 0 });
      setActiveBoxStyles({ top: 0, height: 0 });
      setLineStyles({ top: 0, height: 0 });
    }
  };

  // Recalculate when pathname changes
  useEffect(() => {
    recalculatePositions();
  }, [pathname]);

  // Recalculate when sidebar state changes (collapsed/expanded)
  useEffect(() => {
    // Add a small delay to allow the sidebar transition to complete
    const timer = setTimeout(recalculatePositions, 150);
    return () => clearTimeout(timer);
  }, [state]);

  function handleItemMouseEnter(index: number) {
    if (!indicatorVisible) {
      updateIndicator(index);
      setIndicatorVisible(true);
      setJustActivated(true);
    } else {
      updateIndicator(index);
      setJustActivated(false);
    }

    // Update line position on hover and make it visible
    if (itemRefs.current[index] && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = itemRefs.current[index]!.getBoundingClientRect();
      setLineStyles({
        top: itemRect.top - menuRect.top + 8,
        height: itemRect.height - 16,
      });
      setLineVisible(true);
    }
  }

  function handleMenuMouseLeave() {
    setIndicatorVisible(false);
    setJustActivated(false);

    // Reset line to active item position or hide if no active item
    const activeIndex = getActiveIndex();
    if (
      activeIndex !== -1 &&
      itemRefs.current[activeIndex] &&
      menuRef.current
    ) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = itemRefs.current[activeIndex]!.getBoundingClientRect();
      setLineStyles({
        top: itemRect.top - menuRect.top + 8,
        height: itemRect.height - 16,
      });
      setLineVisible(true);
    } else {
      setLineVisible(false);
    }
  }

  return (
    <SidebarMenu
      ref={menuRef}
      className="relative"
      onMouseLeave={handleMenuMouseLeave}
    >
      {/* Active item background that moves */}
      {hasActiveItem && (
        <motion.div
          className="absolute left-0 right-0 border border-primary/30 bg-primary/5 rounded-md pointer-events-none z-0"
          initial={false}
          animate={{
            top: activeBoxStyles.top,
            height: activeBoxStyles.height,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      )}

      {/* Hover indicator */}
      <motion.div
        className="absolute left-0 right-0 bg-accent rounded-md pointer-events-none z-0"
        initial={{
          top: indicatorStyles.top,
          height: indicatorStyles.height,
          opacity: indicatorVisible ? 1 : 0,
        }}
        animate={{
          top: indicatorStyles.top,
          height: indicatorStyles.height,
          opacity: indicatorVisible ? 1 : 0,
        }}
        transition={
          justActivated
            ? {
                top: { duration: 0 },
                height: { duration: 0 },
                opacity: {
                  duration: justRendered ? 0 : 0.2,
                  ease: "easeInOut",
                },
              }
            : {
                top: { type: "spring", stiffness: 300, damping: 30 },
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3, ease: "easeInOut" },
              }
        }
      />

      {/* Primary colored line on the right edge */}
      <motion.div
        className="absolute -mr-2 w-0.5 bg-primary pointer-events-none z-50"
        animate={{
          top: lineStyles.top,
          height: lineStyles.height,
          opacity: lineVisible ? 1 : 0,
        }}
        transition={{
          top: { type: "spring", stiffness: 300, damping: 30 },
          height: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2, ease: "easeInOut" },
        }}
      />
      {items.map((item, index) => {
        const isActive = getActiveIndex() === index;

        return (
          <SidebarMenuItem
            key={item.title}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onMouseEnter={() => handleItemMouseEnter(index)}
            className="relative"
          >
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={`
                justify-start text-right transition-colors relative z-10
                ${
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }
                hover:bg-transparent
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
