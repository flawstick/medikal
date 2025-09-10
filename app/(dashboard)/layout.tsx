import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={false}>
        <nav id="main-navigation" role="navigation" aria-label="ניווט ראשי">
          <AppSidebar />
        </nav>
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <main
            id="main-content"
            role="main"
            className="flex-1 space-y-4 px-8 pb-8 overflow-y-auto"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
