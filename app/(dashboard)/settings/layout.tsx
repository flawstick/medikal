"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings as SettingsIcon, User, UserPlus, Bell, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { canAccessAdminPanel } from "@/lib/utils"

const baseSettingsTabs = [
  {
    id: "profile",
    label: "פרופיל אישי",
    icon: User,
    path: "/settings",
  },
  {
    id: "notifications",
    label: "התראות",
    icon: Bell,
    path: "/settings/notifications",
  },
  {
    id: "security",
    label: "אבטחה",
    icon: Shield,
    path: "/settings/security",
  },
  {
    id: "admin",
    label: "ניהול משתמשים",
    icon: UserPlus,
    path: "/settings/admin",
    requiresAdmin: true,
  },
]

interface UserProfile {
  id: string
  user_role: string
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setUserProfile(data.profile)
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  // Filter tabs based on user permissions
  const settingsTabs = baseSettingsTabs.filter(tab => {
    if (tab.requiresAdmin) {
      return canAccessAdminPanel(userProfile?.user_role)
    }
    return true
  })

  const currentTab = settingsTabs.find(tab => 
    tab.path === pathname || (tab.path === "/settings" && pathname === "/settings")
  )?.id || "profile"

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">הגדרות</h1>
      </div>

      <Separator />

      <div className="flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentTab === tab.id
                
                return (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={`w-full justify-start text-right h-12 ${
                      isActive 
                        ? "bg-muted text-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => router.push(tab.path)}
                  >
                    <Icon className="h-4 w-4 ml-2" />
                    {tab.label}
                  </Button>
                )
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 max-w-2xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}