import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "מדי-קל - מערכת לוגיסטיקה",
  description: "מערכת ניהול משלוחים ולוגיסטיקה",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
