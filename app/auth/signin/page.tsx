"use client"

import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  useEffect(() => {
    // Check if user is already signed in
    getSession().then(session => {
      if (session) {
        router.push("/")
      }
    })
  }, [router])

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    signIn("credentials", { email, callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">התחברות</CardTitle>
          <CardDescription>
            הכנס את כתובת האימייל שלך כדי להמשיך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                התחבר
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}