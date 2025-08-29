'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Camera, Save, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { OrganizationLogoUpload } from '@/components/organization-logo-upload'

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const params = useParams()
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
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  } | null>(null)

  const orgId = params?.orgId as string

  useEffect(() => {
    if (user) {
      loadProfile()
    }
    if (orgId) {
      loadOrganization()
    }
  }, [user, orgId])

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
          name: data.name || '',
          email: data.email || user?.email || '',
          age: data.age?.toString() || '',
          company: data.company || '',
          avatar_url: data.avatar_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url')
        .eq('id', orgId)
        .single()

      if (data) {
        setOrganization(data)
      }
    } catch (error) {
      console.error('Error loading organization:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
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

      if (error) throw error

      toast({
        title: "פרופיל עודכן",
        description: "הפרטים שלך נשמרו בהצלחה",
      })
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את הפרופיל",
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

  return (
    <div className="p-8 pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">הגדרות</h1>
        <p className="text-muted-foreground">
          נהל את הפרופיל שלך ואת הגדרות הארגון
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            פרופיל אישי
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            הגדרות ארגון
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">

      <div className="space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>תמונת פרופיל</CardTitle>
            <CardDescription>
              עדכן את תמונת הפרופיל שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-3 w-3 text-primary-foreground" />
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
              <div>
                <p className="text-sm text-muted-foreground">
                  JPG, GIF או PNG. מקסימום 1MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>פרטים אישיים</CardTitle>
            <CardDescription>
              עדכן את הפרטים האישיים שלך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="הכנס שם מלא"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">גיל</Label>
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
                <Label htmlFor="company">חברה</Label>
                <Input
                  id="company"
                  value={profile.company}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מידע על החשבון</CardTitle>
            <CardDescription>
              פרטי החשבון שלך במערכת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">מזהה משתמש</Label>
              <Input 
                id="user-id" 
                value={user?.id || ''} 
                disabled
                className="bg-muted font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="created">תאריך הצטרפות</Label>
              <Input 
                id="created" 
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : 'לא זמין'} 
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

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
      </div>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6 mt-6">
          {organization && (
            <div className="space-y-6 w-full">
              <OrganizationLogoUpload
                orgId={organization.id}
                orgName={organization.name}
                currentLogoUrl={organization.logo_url}
                onLogoUpdate={(newLogoUrl) => {
                  setOrganization({
                    ...organization,
                    logo_url: newLogoUrl
                  })
                }}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>פרטי ארגון</CardTitle>
                  <CardDescription>
                    מידע כללי על הארגון
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">שם ארגון</Label>
                    <Input
                      id="org-name"
                      value={organization.name}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-slug">מזהה ארגון</Label>
                    <Input
                      id="org-slug"
                      value={organization.slug}
                      disabled
                      className="bg-muted font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-id">מזהה מערכת</Label>
                    <Input
                      id="org-id"
                      value={organization.id}
                      disabled
                      className="bg-muted font-mono text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}