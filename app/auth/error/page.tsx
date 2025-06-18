"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "יש בעיה בתצורת השרת. אנא פנה למנהל המערכת."
      case "AccessDenied":
        return "הגישה נדחתה. אין לך הרשאה להיכנס למערכת."
      case "Verification":
        return "הטוקן פג תוקף או שימוש כבר."
      default:
        return "שגיאה לא ידועה. אנא נסה שוב."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">שגיאת התחברות</CardTitle>
          <CardDescription>
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/auth/signin">
              נסה שוב
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}