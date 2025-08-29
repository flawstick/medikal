'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, Mail, Users, MoreVertical, Crown, User, Trash2 } from 'lucide-react'
import { getCurrentOrgId } from '@/lib/org-utils'
import { usePathname } from 'next/navigation'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Member {
  id: string
  email: string
  role: 'admin' | 'member'
  joined_at: string
}

interface Invitation {
  email: string
  role: 'admin' | 'member'
  invited_at: string
  invited_by: string
}

interface Organization {
  id: string
  name: string
  members: Member[]
  invitations: Invitation[]
}

export default function MembersPage() {
  const pathname = usePathname()
  const orgId = getCurrentOrgId(pathname)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  useEffect(() => {
    loadOrganization()
  }, [orgId])

  const loadOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/members`)
      if (!response.ok) throw new Error('Failed to load organization')
      
      const data = await response.json()
      setOrganization({
        id: data.organization.id,
        name: data.organization.name,
        members: data.members || [],
        invitations: data.invitations || []
      })
    } catch (error) {
      console.error('Error loading organization:', error)
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את רשימת החברים",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          action: 'invite'
        })
      })

      if (!response.ok) throw new Error('Failed to send invite')

      toast({
        title: "הזמנה נשלחה",
        description: `הזמנה נשלחה בהצלחה ל-${inviteEmail}`,
      })

      setInviteEmail('')
      setInviteDialogOpen(false)
      loadOrganization()
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשלוח את ההזמנה",
        variant: "destructive"
      })
    }
  }

  const removeMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/members?userId=${userId}&type=member`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove member')

      toast({
        title: "חבר הוסר",
        description: "החבר הוסר בהצלחה מהארגון",
      })

      loadOrganization()
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו להסיר את החבר",
        variant: "destructive"
      })
    }
  }

  const removeInvitation = async (email: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/members?email=${email}&type=invitation`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove invitation')

      toast({
        title: "הזמנה בוטלה",
        description: "ההזמנה בוטלה בהצלחה",
      })

      loadOrganization()
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לבטל את ההזמנה",
        variant: "destructive"
      })
    }
  }

  const updateMemberRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update role')

      toast({
        title: "תפקיד עודכן",
        description: "התפקיד עודכן בהצלחה",
      })

      loadOrganization()
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את התפקיד",
        variant: "destructive"
      })
    }
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="p-8 pt-6">
        <div className="mb-8">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">חברים</h1>
        <p className="text-muted-foreground">
          ניהול חברי הצוות, הזמנות ובקשות להצטרפות
        </p>
      </div>

      <div className="grid gap-6 mb-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">סה"כ חברים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization?.members?.length || 0}</div>
            <p className="text-xs text-muted-foreground">חברים פעילים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">הזמנות ממתינות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization?.invitations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">ממתינות לאישור</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Crown className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">מנהלים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization?.members?.filter(m => m.role === 'admin').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">עם הרשאות מנהל</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">
            חברים ({organization?.members?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            הזמנות ({organization?.invitations?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardDescription>רשימת כל חברי הצוות המאושרים</CardDescription>
              <CardTitle className="flex items-center justify-between">
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      הזמן חבר
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>הזמן חבר חדש</DialogTitle>
                      <DialogDescription>
                        שלח הזמנה לחבר חדש להצטרף לארגון
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">כתובת אימייל</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="example@domain.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">תפקיד</Label>
                        <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">חבר</SelectItem>
                            <SelectItem value="admin">מנהל</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        ביטול
                      </Button>
                      <Button onClick={sendInvite}>
                        שלח הזמנה
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="flex items-center gap-2">
                  חברי צוות
                  <Users className="h-5 w-5" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!organization?.members || organization.members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  אין חברי צוות מאושרים
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">פעולות</TableHead>
                      <TableHead className="text-right">תאריך הצטרפות</TableHead>
                      <TableHead className="text-right">תפקיד</TableHead>
                      <TableHead className="text-right">חבר</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem 
                                onClick={() => updateMemberRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                              >
                                {member.role === 'admin' ? 'הורד למשתמש' : 'העלה למנהל'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => removeMember(member.id)}
                              >
                                הסר מהארגון
                                <Trash2 className="h-4 w-4 ml-2" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(member.joined_at).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role === 'admin' ? (
                              <>
                                מנהל
                                <Crown className="h-3 w-3 ml-1" />
                              </>
                            ) : (
                              <>
                                חבר
                                <User className="h-3 w-3 ml-1" />
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-3 justify-end">
                            <div className="text-right">
                              <p className="font-medium">{member.email}</p>
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(member.email)}</AvatarFallback>
                            </Avatar>
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

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                הזמנות ממתינות
                <Mail className="h-5 w-5" />
              </CardTitle>
              <CardDescription>הזמנות שנשלחו לחברים חדשים</CardDescription>
            </CardHeader>
            <CardContent>
              {!organization?.invitations || organization.invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>אין הזמנות ממתינות</p>
                  <p className="text-sm">ניתן לשלוח הזמנות דרך כפתור "הזמן חבר"</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">פעולות</TableHead>
                      <TableHead className="text-right">תאריך הזמנה</TableHead>
                      <TableHead className="text-right">תפקיד</TableHead>
                      <TableHead className="text-right">אימייל</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.invitations.map((invitation) => (
                      <TableRow key={invitation.email}>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeInvitation(invitation.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          {new Date(invitation.invited_at).toLocaleDateString('he-IL')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {invitation.role === 'admin' ? 'מנהל' : 'חבר'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{invitation.email}</TableCell>
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