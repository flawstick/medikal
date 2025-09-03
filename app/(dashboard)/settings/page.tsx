"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { User, Upload, Mail, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfile {
  id: string
  email: string
  name: string
  age: number
  avatar_url: string
  user_role: string
  created_at: string
  updated_at: string
}

export default function ProfileSettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
   const [displayName, setDisplayName] = useState("")
   const [profileImage, setProfileImage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        // Get the current session token
        const supabase = (await import("@/lib/supabase-client")).getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        const response = await fetch("/api/profile", {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setProfile(data.profile)
            setDisplayName(data.profile.name || "")
            setProfileImage(data.profile.avatar_url || "")
          }
        } else {
          const errorData = await response.json()
          if (response.status === 404) {
            toast({
              title: "Profile Not Found",
              description: errorData.details || "Your profile hasn't been set up yet. Please contact an administrator.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: errorData.details || errorData.error || "Failed to load profile data.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Additional useEffect to update form fields when profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || "")
      setProfileImage(profile.avatar_url || "")
    }
  }, [profile])

  const handleImageUpload = async (file: File) => {
    if (!user) return

    setIsUploading(true)
    try {
       // Get auth token - user object doesn't have data property in this context
       // We'll need to get the session from the auth context instead
       const currentUser = user
       if (!currentUser) {
         throw new Error("No user found")
       }

       // Get upload URL from R2 (remove authorization header for now)
       const uploadResponse = await fetch("/api/r2/upload", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           filename: file.name,
           contentType: file.type,
         }),
       })

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { url, key } = await uploadResponse.json()

      // Upload file to R2
      const fileUploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!fileUploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      // Get the public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
      setProfileImage(publicUrl)

      toast({
        title: "הצלחה",
        description: "התמונה הועלתה בהצלחה",
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהעלאת התמונה",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: displayName.trim() || undefined,
          avatar_url: profileImage.trim() || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "הצלחה",
          description: "הפרופיל עודכן בהצלחה",
        })
        // Refresh profile data
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
        }
      } else {
        const error = await response.json()
        toast({
          title: "שגיאה",
          description: error.error || "אירעה שגיאה בעדכון הפרופיל",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחיבור לשרת",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleMap = {
      admin: "מנהל מערכת",
      manager: "מנהל",
      operator: "מפעיל"
    }
    return roleMap[role as keyof typeof roleMap] || role
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Profile Overview Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture Section Skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Skeleton */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>

              {/* Display Name Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Role Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>

              {/* Registration Date Skeleton */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            פרופיל אישי
          </CardTitle>
          <CardDescription>
            נהל את פרטי החשבון שלך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileImage} alt="תמונת פרופיל" />
              <AvatarFallback className="text-lg">
                {getInitials(user?.email || "")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label>תמונת פרופיל</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isUpdating}
                >
                  <Upload className="h-4 w-4 ml-2" />
                  {isUploading ? "מעלה..." : "העלה תמונה"}
                </Button>
                {profileImage && (
                  <Button
                    variant="ghost"
                    onClick={() => setProfileImage("")}
                    disabled={isUploading || isUpdating}
                  >
                    הסר תמונה
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                כתובת אימייל
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                לא ניתן לשנות את כתובת האימייל
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">שם מלא</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="השם המלא שלך"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isUpdating}
              />
            </div>



            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label>תפקיד במערכת</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {getRoleLabel(profile?.user_role || "operator")}
                </Badge>
              </div>
            </div>

            {/* Registration Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                תאריך הרשמה
              </Label>
              <Input
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('he-IL') : ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <Button 
            onClick={handleUpdateProfile} 
            disabled={isUpdating || isUploading}
            className="w-full"
          >
            {isUpdating ? "מעדכן פרופיל..." : "עדכן פרופיל"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}