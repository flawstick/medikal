"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Users, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Building,
  CreditCard,
  Key,
  Lock
} from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { 
      label: "פרופיל", 
      href: "/settings",
      icon: User
    },
    { 
      label: "ארגון", 
      href: "/settings/organization",
      icon: Building
    },
    { 
      label: "חברים", 
      href: "/settings/members",
      icon: Users
    },
  ];

  return (
    <div className="flex justify-center min-h-screen">
      <div className="flex w-full max-w-6xl">
        {/* Settings Sidebar */}
        <nav className="w-72 flex-shrink-0">
          <div className="p-8">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 rounded-lg px-4 py-3 text-base transition-all hover:bg-accent hover:text-accent-foreground ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}