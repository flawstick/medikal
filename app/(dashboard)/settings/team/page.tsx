'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Check, X, UserCheck, Clock, Users, Mail, Calendar, Building } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface UserProfile {
  id: string
  email: string
  name: string
  age: number
  company: string
  avatar_url?: string
  approved: boolean
  created_at: string
}

export default function TeamSettingsPage() {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([])
  const [approvedUsers, setApprovedUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      // Load all user profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setPendingUsers(data.filter(u => !u.approved))
        setApprovedUsers(data.filter(u => u.approved))
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את רשימת המשתמשים",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    setProcessingId(userId)
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ approved: true })
        .eq('id', userId)

      if (profileError) throw profileError

      toast({
        title: "משתמש אושר",
        description: "המשתמש אושר בהצלחה וקיבל גישה למערכת",
      })

      // Reload users
      await loadUsers()
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לאשר את המשתמש",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId: string) => {
    setProcessingId(userId)
    try {
      // Delete user profile
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "בקשה נדחתה",
        description: "הבקשה להצטרפות נדחתה",
      })

      // Reload users
      await loadUsers()
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לדחות את הבקשה",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded-md" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded-md mb-1" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="w-full">
          <div className="flex gap-2 mb-4">
            <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
          </div>

          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded-md mb-2" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
                        <div className="h-3 w-48 bg-muted animate-pulse rounded-md" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ניהול צוות</h1>
        <p className="text-muted-foreground mt-2">אשר או דחה בקשות הצטרפות וניהול חברי הצוות</p>
      </div>

      <div className="grid gap-6 mb-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ חברי צוות</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedUsers.length}</div>
            <p className="text-xs text-muted-foreground">חברים פעילים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינים לאישור</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">בקשות חדשות</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">חברה</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">מדי-קל</div>
            <p className="text-xs text-muted-foreground">כל המשתמשים</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            ממתינים לאישור ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            חברי צוות ({approvedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>בקשות הצטרפות</CardTitle>
              <CardDescription>אשר או דחה בקשות של משתמשים חדשים</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  אין בקשות ממתינות
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>משתמש</TableHead>
                      <TableHead>גיל</TableHead>
                      <TableHead>תאריך בקשה</TableHead>
                      <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.age}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              disabled={processingId === user.id}
                            >
                              <Check className="h-4 w-4 ml-1" />
                              אשר
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(user.id)}
                              disabled={processingId === user.id}
                            >
                              <X className="h-4 w-4 ml-1" />
                              דחה
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>חברי צוות פעילים</CardTitle>
              <CardDescription>רשימת כל חברי הצוות המאושרים</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  אין חברי צוות מאושרים
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>משתמש</TableHead>
                      <TableHead>גיל</TableHead>
                      <TableHead>תאריך הצטרפות</TableHead>
                      <TableHead>סטטוס</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.age}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 ml-1" />
                            פעיל
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}