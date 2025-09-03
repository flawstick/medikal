"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, AlertTriangle, Edit, Trash2, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { canCreateUsers } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  user_role: string
}

interface User {
  id: string
  email: string
  name: string
  user_role: string
  created_at: string
  updated_at: string
}

export default function AdminSettingsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("operator")
  const [displayName, setDisplayName] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: "", user_role: "", email: "" })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        console.log('No user found, skipping profile fetch')
        setIsLoading(false)
        return
      }

      console.log('Fetching user profile for user:', user.id)
      try {
        const response = await fetch("/api/profile")
        console.log('Profile API response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Profile API response data:', data)

          if (data.profile) {
            console.log('Setting user profile:', data.profile)
            setUserProfile(data.profile)
          } else {
            console.log('No profile found in response')
          }
        } else {
          const errorData = await response.json()
          console.error("Profile API error:", errorData)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return
      
      try {
        const response = await fetch("/api/admin/users")
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [user])

  const hasCreatePermission = canCreateUsers(userProfile?.user_role)

  console.log('Frontend permission check:', {
    userProfile,
    userRole: userProfile?.user_role,
    hasCreatePermission
  })

  // Redirect unauthorized users
  useEffect(() => {
    if (!isLoading && !hasCreatePermission) {
      // User doesn't have permission, but we'll show the access denied message instead of redirecting
      // This allows them to see why they can't access this page
    }
  }, [isLoading, hasCreatePermission])

  const handleCreateAccount = async () => {
    if (!email.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת אימייל",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          displayName: displayName.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "הצלחה",
          description: `המשתמש נוצר בהצלחה! סיסמה זמנית: ${data.tempPassword}`,
          duration: 10000, // Show for 10 seconds since it contains password
        })
        setEmail("")
        setRole("operator")
        setDisplayName("")
        // Refresh users list
        const response = await fetch("/api/admin/users")
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } else {
        toast({
          title: "שגיאה",
          description: data.error || "אירעה שגיאה ביצירת המשתמש",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחיבור לשרת",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || "",
      user_role: user.user_role,
      email: user.email
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users?id=${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "הצלחה",
          description: "המשתמש עודכן בהצלחה",
        })
        setEditingUser(null)
        // Refresh users list
        const usersResponse = await fetch("/api/admin/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }
      } else {
        toast({
          title: "שגיאה",
          description: data.error || "אירעה שגיאה בעדכון המשתמש",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחיבור לשרת",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/admin/users?id=${userToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "הצלחה",
          description: "המשתמש נמחק בהצלחה",
        })
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        // Refresh users list
        const usersResponse = await fetch("/api/admin/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }
      } else {
        toast({
          title: "שגיאה",
          description: data.error || "אירעה שגיאה במחיקת המשתמש",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בחיבור לשרת",
        variant: "destructive",
      })
    }
  }

  const getRoleLabel = (role: string) => {
    const roleMap = {
      admin: "מנהל מערכת",
      manager: "מנהל",
      operator: "מפעיל"
    }
    return roleMap[role as keyof typeof roleMap] || role
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email field skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Display name field skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Role field skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Button skeleton */}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!hasCreatePermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            גישה נדחתה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              אין לך הרשאה ליצור משתמשים חדשים. רק מנהלים יכולים לבצע פעולה זו.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create User Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            יצירת משתמש חדש
          </CardTitle>
          <CardDescription>
            צור חשבון חדש במערכת. המשתמש יקבל הזמנה באימייל.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">כתובת אימייל</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">שם תצוגה (אופציונלי)</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="שם המשתמש"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">תפקיד</Label>
            <Select value={role} onValueChange={setRole} disabled={isCreating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">מפעיל</SelectItem>
                <SelectItem value="manager">מנהל</SelectItem>
                <SelectItem value="admin">מנהל מערכת</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "יוצר משתמש..." : "צור משתמש"}
          </Button>
        </CardContent>
      </Card>

      {/* Users Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ניהול משתמשים
          </CardTitle>
          <CardDescription>
            צפה בכל המשתמשים במערכת, ערוך או מחק חשבונות
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || "ללא שם"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getRoleLabel(user.user_role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ערוך משתמש</DialogTitle>
            <DialogDescription>
              ערוך את פרטי המשתמש
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">שם</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">אימייל</Label>
              <Input
                id="editEmail"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">תפקיד</Label>
              <Select 
                value={editForm.user_role} 
                onValueChange={(value) => setEditForm({...editForm, user_role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">מפעיל</SelectItem>
                  <SelectItem value="manager">מנהל</SelectItem>
                  <SelectItem value="admin">מנהל מערכת</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handleUpdateUser}>
              עדכן
            </Button>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחק משתמש</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את המשתמש {userToDelete?.email}? 
              פעולה זו תמחק לצמיתות את החשבון ולא ניתן לבטלה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}