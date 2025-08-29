'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadOrgLogo, getOrgLogoUrl, updateOrgLogo } from '@/lib/upload-utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface OrganizationLogoUploadProps {
  orgId: string
  orgName: string
  currentLogoUrl?: string
  onLogoUpdate?: (newLogoUrl: string) => void
}

export function OrganizationLogoUpload({ 
  orgId, 
  orgName, 
  currentLogoUrl, 
  onLogoUpdate 
}: OrganizationLogoUploadProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '')
  const supabase = createClientComponentClient()

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ תמונה תקין",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "שגיאה", 
        description: "גודל הקובץ חייב להיות קטן מ-2MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      // Upload to R2
      const logoKey = await uploadOrgLogo(file, orgId)
      
      // Update organization in database
      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: logoKey })
        .eq('id', orgId)

      if (error) throw error

      // Update local state
      const newLogoUrl = getOrgLogoUrl(logoKey)
      setLogoUrl(newLogoUrl)
      
      // Notify parent component
      onLogoUpdate?.(newLogoUrl)
      
      toast({
        title: "הצלחה!",
        description: "לוגו הארגון עודכן בהצלחה",
      })
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להעלות את הלוגו",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const orgInitials = orgName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card>
      <CardHeader>
        <CardTitle>לוגו ארגון</CardTitle>
        <CardDescription>
          העלה לוגו לארגון שלך כדי לאפיין אותו במערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoUrl} alt={`לוגו ${orgName}`} />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {orgInitials}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="logo-upload" 
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Camera className="h-4 w-4 text-primary-foreground" />
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              JPG, PNG או SVG. מקסימום 2MB.
            </p>
            <p className="text-sm text-muted-foreground">
              הלוגו יוצג בבוחר הארגונים ובממשק המערכת
            </p>
            {isUploading && (
              <p className="text-sm text-primary">
                מעלה לוגו...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}