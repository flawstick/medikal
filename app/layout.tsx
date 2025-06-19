import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "מדי-קל - מערכת לוגיסטיקה",
  description: "מערכת ניהול משלוחים ולוגיסטיקה",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="sr-only">
          <a href="#main-content" className="skip-link">
            דלג לתוכן הראשי
          </a>
          <a href="#main-navigation" className="skip-link">
            דלג לניווט הראשי
          </a>
        </div>
        <Providers>
          <SidebarProvider defaultOpen={false}>
            <nav id="main-navigation" role="navigation" aria-label="ניווט ראשי">
              <AppSidebar />
            </nav>
            <SidebarInset className="flex flex-col min-h-screen">
              <main id="main-content" role="main" className="flex-1 space-y-4 p-8 pt-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
