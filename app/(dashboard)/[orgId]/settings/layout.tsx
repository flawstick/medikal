"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { 
  User, 
  Users, 
  Building,
} from 'lucide-react';
import { TeamSwitcher } from '@/components/team-switcher';
import { MedikalLogo } from '@/components/medikal-logo';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const orgId = params.orgId as string;
  
  const navItems = [
    { 
      label: "פרופיל", 
      href: `/${orgId}/settings`,
      icon: User
    },
    { 
      label: "ארגון", 
      href: `/${orgId}/settings/organization`,
      icon: Building
    },
    { 
      label: "חברים", 
      href: `/${orgId}/settings/members`,
      icon: Users
    },
  ];

  const mediKalData = {
    teams: [
      {
        name: "medi-קל",
        logo: MedikalLogo,
        plan: "מערכת ניהול משלוחים",
      },
    ],
  };

  return (
    <div className="flex justify-center min-h-screen">
      <div className="flex w-full max-w-6xl">
        {/* Settings Sidebar */}
        <nav className="w-72 flex-shrink-0">
          <div className="p-8">
            <div className="mb-6 flex justify-end">
              <TeamSwitcher teams={mediKalData.teams} />
            </div>
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