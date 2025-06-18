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
        <Providers>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen">
              <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
