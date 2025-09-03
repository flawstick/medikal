import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function NotificationsSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          הגדרות התראות
        </CardTitle>
        <CardDescription>
          נהל את הגדרות ההתראות במערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">הגדרות התראות יתווספו בקרוב...</p>
      </CardContent>
    </Card>
  )
}