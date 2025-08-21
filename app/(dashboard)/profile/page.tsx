'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Save, Mail, User, Calendar, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    company: '',
    avatar_url: ''
  })

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
          age: data.age?.toString() || '',
          company: data.company || '',
          avatar_url: data.avatar_url || user?.user_metadata?.avatar_url || ''
        })
      } else {
        // Use user metadata if no profile exists
        setProfile({
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
          age: user?.user_metadata?.age || '',
          company: user?.user_metadata?.company || '',
          avatar_url: user?.user_metadata?.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          age: profile.age,
          company: profile.company,
          avatar_url: profile.avatar_url
        }
      })

      if (updateError) throw updateError

      // Upsert profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          email: profile.email,
          name: profile.name,
          age: profile.age ? parseInt(profile.age) : null,
          company: profile.company,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      toast({
        title: "פרופיל עודכן",
        description: "הפרטים שלך נשמרו בהצלחה",
      })
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא הצלחנו לעדכן את הפרופיל",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfile({ ...profile, avatar_url: publicUrl })
      
      toast({
        title: "תמונה הועלתה",
        description: "תמונת הפרופיל עודכנה בהצלחה",
      })
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להעלות את התמונה",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-8" />
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md mb-2" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded-md" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md mb-2" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                    <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-8 pt-6">
      <h1 className="text-3xl font-bold mb-8">הפרופיל שלי</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>פרטים אישיים</CardTitle>
            <CardDescription>עדכן את הפרטים האישיים שלך</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isSaving}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{profile.name || 'משתמש'}</h3>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="inline h-4 w-4 ml-1" />
                  שם מלא
                </Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="הכנס שם מלא"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 ml-1" />
                  אימייל
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">
                  <Calendar className="inline h-4 w-4 ml-1" />
                  גיל
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="120"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  placeholder="הכנס גיל"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  <Building className="inline h-4 w-4 ml-1" />
                  חברה
                </Label>
                <Input
                  id="company"
                  value={profile.company}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    שמור שינויים
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סטטוס חשבון</CardTitle>
            <CardDescription>מידע על החשבון שלך במערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">תאריך הצטרפות</p>
                <p className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : 'לא זמין'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">סטטוס</p>
                <p className="font-medium">
                  {user?.user_metadata?.approved ? (
                    <span className="text-green-600">מאושר</span>
                  ) : (
                    <span className="text-yellow-600">ממתין לאישור</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}