'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTheme } from 'next-themes'
import { Palette, Sun, Moon, Monitor } from 'lucide-react'

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="container max-w-4xl mx-auto p-8 pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ערכת נושא</h1>
        <p className="text-muted-foreground">
          התאמת המראה והתחושה של המערכת
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              בחירת ערכת נושא
            </CardTitle>
            <CardDescription>
              בחרו את ערכת הנושא המועדפת עליכם
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={theme} 
              onValueChange={setTheme}
              className="grid gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  בהיר
                  <span className="text-muted-foreground text-sm">נושא בהיר עם רקע לבן</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  כהה
                  <span className="text-muted-foreground text-sm">נושא כהה עם רקע שחור</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  מערכת
                  <span className="text-muted-foreground text-sm">יתאים לאופן של המערכת שלכם</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>צפייה מקדימה</CardTitle>
            <CardDescription>
              כך תיראה המערכת עם הנושא שבחרתם
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="font-medium">דשבורד ראשי</span>
              </div>
              <p className="text-sm text-muted-foreground">
                זהו דוגמא של טקסט רגיל במערכת שלכם
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm">כפתור ראשי</Button>
                <Button size="sm" variant="outline">כפתור משני</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}