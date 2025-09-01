"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Mail, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { signInWithEmail } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('נא להזין כתובת אימייל')
      return
    }

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await signInWithEmail(email.trim())
      
      if (error) {
        setError(error.message || 'שגיאה בשליחת הקישור')
      } else {
        setMessage('קישור התחברות נשלח לאימייל שלך')
      }
    } catch (err) {
      setError('שגיאה בשליחת הקישור')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative z-0 w-full max-w-md p-4">
        {/* Animated background elements */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.primary.400/.15),theme(colors.primary.600/.08),transparent_60%)] blur-[100px]" />
          <div className="absolute right-[-15%] top-[5%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(ellipse_at_center,theme(colors.accent.400/.12),theme(colors.accent.600/.06),transparent_60%)] blur-[100px]" />
        </div>

        <Card className="shadow-xl border-muted/20">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold text-right">ברוכים הבאים למדי-קל</CardTitle>
            <CardDescription className="text-right text-muted-foreground">
              הזינו את כתובת האימייל שלכם לקבלת קישור התחברות
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-right block">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="שם@דואר.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-right"
                  dir="ltr"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-right">{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="text-right">{message}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    שולח קישור...
                  </>
                ) : (
                  <>
                    <Mail className="ml-2 h-4 w-4" />
                    שלח קישור התחברות
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p className="text-right">
                הקישור יישלח לאימייל שלכם ויהיה בתוקף למשך 60 דקות
              </p>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}