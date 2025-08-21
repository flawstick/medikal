'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Building, Save, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function OrganizationPage() {
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "הועתק",
      description: "המזהה הועתק ללוח",
    })
  }

  return (
    <div className="p-8 pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ארגון</h1>
        <p className="text-muted-foreground">
          ניהול פרטי הארגון והגדרות כלליות
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              פרטי ארגון
            </CardTitle>
            <CardDescription>
              עדכון פרטי הארגון הבסיסיים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">שם הארגון</Label>
              <Input
                id="org-name"
                value="מדי-קל"
                placeholder="הכנס שם ארגון"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">תיאור</Label>
              <Textarea
                id="org-description"
                value="מערכת ניהול לוגיסטיקה רפואית מתקדמת לניהול משלוחים ומשימות"
                placeholder="תיאור קצר של הארגון"
                className="resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>כתובת עסקית ראשית</CardTitle>
            <CardDescription>
              כתובת המשרדים הראשיים של הארגון
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address-line1">כתובת שורה 1</Label>
                <Input
                  id="address-line1"
                  value="קהילת יהדות צרפת"
                  placeholder="רחוב ומספר"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address-line2">כתובת שורה 2</Label>
                <Input
                  id="address-line2"
                  placeholder="דירה, קומה וכו'"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">עיר</Label>
                <Input
                  id="city"
                  value="מעלות-תרשיחא"
                  placeholder="עיר"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">מחוז / מדינה</Label>
                <Input
                  id="state"
                  value="הצפון"
                  placeholder="מחוז או מדינה"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal">מיקוד</Label>
                <Input
                  id="postal"
                  value="2108349"
                  placeholder="מיקוד"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">מדינה</Label>
              <Input
                id="country"
                value="ישראל"
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מזהה מס עסקי</CardTitle>
            <CardDescription>
              פרטי המס והחשבונאות של הארגון
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tax-type">סוג מס</Label>
                <Input
                  id="tax-type"
                  value="Israel VAT"
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-id">מספר מזהה מס</Label>
                <Input
                  id="tax-id"
                  value="000012345"
                  placeholder="מספר עוסק מורשה"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מזהה ארגון</CardTitle>
            <CardDescription>
              מזהה ייחודי של הארגון במערכת
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value="1c595cc2-0e29-4b19-84f3-ab4ec61f655c"
                disabled
                className="bg-muted font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard("1c595cc2-0e29-4b19-84f3-ab4ec61f655c")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="h-4 w-4 ml-2" />
            שמור שינויים
          </Button>
        </div>
      </div>
    </div>
  )
}