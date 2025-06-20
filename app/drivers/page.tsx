"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Edit, Trash2, UserCheck, UserX, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  username: string;
  hashed_password: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export default function DriversPage() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    license_number: "",
    username: "",
    password: "",
  });
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordDriver, setPasswordDriver] = useState<Driver | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/drivers");
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        throw new Error("Failed to fetch drivers");
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הנהגים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      license_number: "",
      username: "",
      password: "",
    });
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הנהג, שם משתמש וסיסמה הם שדות חובה",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הנהג נוצר בהצלחה",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchDrivers();
      } else {
        throw new Error("Failed to create driver");
      }
    } catch (error) {
      console.error("Error creating driver:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת הנהג",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editingDriver || !formData.name.trim() || !formData.username.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הנהג ושם משתמש הם שדות חובה",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/drivers/${editingDriver.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          license_number: formData.license_number,
          username: formData.username,
          is_active: editingDriver.is_active,
        }),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הנהג עודכן בהצלחה",
        });
        setIsEditDialogOpen(false);
        setEditingDriver(null);
        resetForm();
        fetchDrivers();
      } else {
        throw new Error("Failed to update driver");
      }
    } catch (error) {
      console.error("Error updating driver:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הנהג",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (driver: Driver) => {
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הנהג נמחק בהצלחה",
        });
        fetchDrivers();
      } else {
        throw new Error("Failed to delete driver");
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הנהג",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (driver: Driver) => {
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...driver,
          is_active: !driver.is_active,
        }),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: `הנהג ${!driver.is_active ? "הופעל" : "הושבת"} בהצלחה`,
        });
        fetchDrivers();
      } else {
        throw new Error("Failed to toggle driver status");
      }
    } catch (error) {
      console.error("Error toggling driver status:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשינוי סטטוס הנהג",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone || "",
      email: driver.email || "",
      license_number: driver.license_number || "",
      username: driver.username || "",
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const openPasswordDialog = (driver: Driver) => {
    setPasswordDriver(driver);
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordChange = async () => {
    if (!passwordDriver || !passwordForm.newPassword.trim()) {
      toast({
        title: "שגיאה",
        description: "סיסמה חדשה היא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/drivers/${passwordDriver.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הסיסמה עודכנה בהצלחה",
        });
        setIsPasswordDialogOpen(false);
        setPasswordDriver(null);
        resetPasswordForm();
      } else {
        throw new Error("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הסיסמה",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-36" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">שם משתמש</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">רישיון</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">תאריך יצירה</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-right">ניהול נהגים</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                הוסף נהג חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-right">הוסף נהג חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right block">שם הנהג *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="הכנס שם הנהג"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right block">טלפון</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="הכנס מספר טלפון"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right block">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="הכנס כתובת אימייל"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number" className="text-right block">מספר רישיון</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    placeholder="הכנס מספר רישיון"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-right block">שם משתמש *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="הכנס שם משתמש"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-right block">סיסמה *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="הכנס סיסמה"
                    className="text-right"
                  />
                </div>
              </div>
              <DialogFooter className="flex-row-reverse gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleCreate}>
                  צור נהג
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">שם משתמש</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">רישיון</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תאריך יצירה</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="text-right font-medium">{driver.name}</TableCell>
                  <TableCell className="text-right font-mono">{driver.username}</TableCell>
                  <TableCell className="text-right">{driver.phone || "-"}</TableCell>
                  <TableCell className="text-right">{driver.email || "-"}</TableCell>
                  <TableCell className="text-right">{driver.license_number || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={driver.is_active ? "default" : "secondary"}>
                      {driver.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatDate(driver.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(driver)}>
                          <Edit className="mr-2 h-4 w-4" /> ערוך
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPasswordDialog(driver)}>
                          <KeyRound className="mr-2 h-4 w-4" /> שנה סיסמה
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(driver)}>
                          {driver.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" /> השבת
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" /> הפעל
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> מחק
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-right">מחיקת נהג</AlertDialogTitle>
                              <AlertDialogDescription className="text-right">
                                האם אתה בטוח שברצונך למחוק את הנהג {driver.name}?
                                פעולה זו לא ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(driver)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">ערוך נהג</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-right block">שם הנהג *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הכנס שם הנהג"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-right block">טלפון</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="הכנס מספר טלפון"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-right block">אימייל</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="הכנס כתובת אימייל"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-license_number" className="text-right block">מספר רישיון</Label>
              <Input
                id="edit-license_number"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                placeholder="הכנס מספר רישיון"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="text-right block">שם משתמש *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="הכנס שם משתמש"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEdit}>
              עדכן נהג
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">שנה סיסמה - {passwordDriver?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-right block">סיסמה חדשה *</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="הכנס סיסמה חדשה"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-right block">אישור סיסמה *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="אשר סיסמה חדשה"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => {
              setIsPasswordDialogOpen(false);
              setPasswordDriver(null);
              resetPasswordForm();
            }}>
              ביטול
            </Button>
            <Button onClick={handlePasswordChange}>
              עדכן סיסמה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}