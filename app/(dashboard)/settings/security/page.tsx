import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function SecuritySettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          הגדרות אבטחה
        </CardTitle>
        <CardDescription>
          נהל את הגדרות האבטחה והרשאות במערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">הגדרות אבטחה יתווספו בקרוב...</p>
      </CardContent>
    </Card>
  )
}