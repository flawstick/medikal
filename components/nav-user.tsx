"use client"

import { useState, useEffect } from 'react'
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
import { CreditCard, LogOut, MoreVertical, Settings, UserCircle2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar_url: ''
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (data) {
        setProfile({
          name: data.name || user?.user_metadata?.name || '',
          email: data.email || user?.email || '',
          avatar_url: data.avatar_url || user?.user_metadata?.avatar_url || ''
        })
      } else {
        // Use user metadata if no profile exists
        setProfile({
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
          avatar_url: user?.user_metadata?.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback to user metadata on error
      setProfile({
        name: user?.user_metadata?.name || '',
        email: user?.email || '',
        avatar_url: user?.user_metadata?.avatar_url || ''
      })
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = profile.name || user?.email?.split('@')[0] || 'משתמש'
  
  // Generate initials from the full name
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const nameParts = name.trim().split(' ').filter(part => part.length > 0)
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  const initials = getInitials(displayName)

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
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">{profile.email || user?.email}</span>
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
                  <span className="text-muted-foreground truncate text-xs">{profile.email || user?.email}</span>
                </div>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="justify-end" onClick={() => router.push('/profile')}>
                <span>פרופיל</span>
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
            <DropdownMenuItem className="justify-end" onClick={() => signOut()}>
              <span>התנתק</span>
              <LogOut className="ml-2 size-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
