"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { CreditCard, LogOut, MoreVertical, Settings, UserCircle2, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
    router.push('/auth/login')
  }

  const handleSignIn = () => {
    router.push('/auth/login')
  }

  // If loading, show skeleton
  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // If no user, show sign in button
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button
            onClick={handleSignIn}
            variant="outline"
            size="sm"
            className="w-full justify-start text-right"
          >
            <Mail className="ml-2 h-4 w-4" />
            התחבר למערכת
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Get user display info
  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'משתמש'
  const displayEmail = user.email || ''
  const displayAvatar = user.user_metadata?.avatar_url || "/placeholder.svg"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="
                data-[state=open]:bg-muted data-[state=open]:text-foreground 
                hover:bg-muted hover:text-foreground
                justify-start text-right transition-colors
              "
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">{displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "top" : "left"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-right text-sm">
                <div className="grid flex-1 text-right text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">{displayEmail}</span>
                </div>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="justify-end">
                <span>חשבון</span>
                <UserCircle2 className="ml-2 size-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-end">
                <span>חיובים</span>
                <CreditCard className="ml-2 size-4" />
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-end">
                <span>הגדרות</span>
                <Settings className="ml-2 size-4" />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-end cursor-pointer" 
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <span>{signingOut ? 'מתנתק...' : 'התנתק'}</span>
              <LogOut className="ml-2 size-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
