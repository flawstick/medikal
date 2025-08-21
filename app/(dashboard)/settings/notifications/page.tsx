'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, Mail, MessageSquare, AlertTriangle } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="container max-w-4xl mx-auto p-8 pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">התראות</h1>
        <p className="text-muted-foreground">
          ניהול הגדרות התראות ודוא״ל
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              התראות משימות
            </CardTitle>
            <CardDescription>
              קבלו התראות על עדכונים במשימות וסטטוס משלוחים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-updates">עדכוני משימות חדשות</Label>
              <Switch id="task-updates" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status-changes">שינויי סטטוס משלוחים</Label>
              <Switch id="status-changes" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="urgent-tasks">משימות דחופות</Label>
              <Switch id="urgent-tasks" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              התראות דוא״ל
            </CardTitle>
            <CardDescription>
              בחרו איזה התראות תרצו לקבל בדוא״ל
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-daily">סיכום יומי</Label>
              <Switch id="email-daily" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-weekly">דוח שבועי</Label>
              <Switch id="email-weekly" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-urgent">משימות דחופות בלבד</Label>
              <Switch id="email-urgent" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              התראות צוות
            </CardTitle>
            <CardDescription>
              הגדרות התראות לניהול צוות וחברים חדשים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-members">חברים חדשים ממתינים לאישור</Label>
              <Switch id="new-members" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="team-updates">עדכוני צוות</Label>
              <Switch id="team-updates" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button variant="outline">איפוס</Button>
          <Button>שמור הגדרות</Button>
        </div>
      </div>
    </div>
  )
}