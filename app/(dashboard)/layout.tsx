import type React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav id="main-navigation" role="navigation" aria-label="ניווט ראשי">
        <AppSidebar />
      </nav>
      <SidebarInset className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <main
          id="main-content"
          role="main"
          className="flex-1"
        >
          {children}
        </main>
      </SidebarInset>
    </>
  );
}