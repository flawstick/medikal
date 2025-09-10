"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlowButton } from "@/components/ui/flow-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Edit, Trash2, Car, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Car {
  id: number;
  plate_number: string;
  make: string | null;
  model: string | null;
  year: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export default function CarsPage() {
  const { toast } = useToast();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    plate_number: "",
    make: "",
    model: "",
    year: "",
    color: "",
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch("/api/cars");
      if (response.ok) {
        const data = await response.json();
        setCars(data);
      } else {
        throw new Error("Failed to fetch cars");
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הרכבים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plate_number: "",
      make: "",
      model: "",
      year: "",
      color: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.plate_number.trim()) {
      toast({
        title: "שגיאה",
        description: "מספר רכב הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הרכב נוצר בהצלחה",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchCars();
      } else if (response.status === 409) {
        toast({
          title: "שגיאה",
          description: "מספר רכב זה כבר קיים במערכת",
          variant: "destructive",
        });
      } else {
        throw new Error("Failed to create car");
      }
    } catch (error) {
      console.error("Error creating car:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת הרכב",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editingCar || !formData.plate_number.trim()) {
      toast({
        title: "שגיאה",
        description: "מספר רכב הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/cars/${editingCar.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          is_active: editingCar.is_active,
        }),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הרכב עודכן בהצלחה",
        });
        setIsEditDialogOpen(false);
        setEditingCar(null);
        resetForm();
        fetchCars();
      } else if (response.status === 409) {
        toast({
          title: "שגיאה",
          description: "מספר רכב זה כבר קיים במערכת",
          variant: "destructive",
        });
      } else {
        throw new Error("Failed to update car");
      }
    } catch (error) {
      console.error("Error updating car:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הרכב",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (car: Car) => {
    try {
      const response = await fetch(`/api/cars/${car.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "הרכב נמחק בהצלחה",
        });
        fetchCars();
      } else {
        throw new Error("Failed to delete car");
      }
    } catch (error) {
      console.error("Error deleting car:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הרכב",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (car: Car) => {
    try {
      const response = await fetch(`/api/cars/${car.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...car,
          is_active: !car.is_active,
        }),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: `הרכב ${!car.is_active ? "הופעל" : "הושבת"} בהצלחה`,
        });
        fetchCars();
      } else {
        throw new Error("Failed to toggle car status");
      }
    } catch (error) {
      console.error("Error toggling car status:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשינוי סטטוס הרכב",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (car: Car) => {
    setEditingCar(car);
    setFormData({
      plate_number: car.plate_number,
      make: car.make || "",
      model: car.model || "",
      year: car.year || "",
      color: car.color || "",
    });
    setIsEditDialogOpen(true);
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
                  <TableHead className="text-right">מספר רכב</TableHead>
                  <TableHead className="text-right">יצרן</TableHead>
                  <TableHead className="text-right">דגם</TableHead>
                  <TableHead className="text-right">שנה</TableHead>
                  <TableHead className="text-right">צבע</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">תאריך יצירה</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 font-mono" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12" />
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
    <div className="pt-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-right flex items-center gap-2">
            <span>ניהול רכבים</span>
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <div>
                <FlowButton text="הוסף רכב חדש" iconRight={<Plus className="h-4 w-4" />} />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-right">הוסף רכב חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plate_number" className="text-right block">מספר רכב *</Label>
                  <Input
                    id="plate_number"
                    value={formData.plate_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                    placeholder="לדוגמה: 12-345-67"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make" className="text-right block">יצרן</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="לדוגמה: איווקו, מרצדס"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-right block">דגם</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="לדוגמה: Daily, Sprinter"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year" className="text-right block">שנה</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="לדוגמה: 2020"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-right block">צבע</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="לדוגמה: לבן, כחול"
                    className="text-right"
                  />
                </div>
              </div>
              <DialogFooter className="flex-row-reverse gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleCreate}>
                  צור רכב
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">מספר רכב</TableHead>
                <TableHead className="text-right">יצרן</TableHead>
                <TableHead className="text-right">דגם</TableHead>
                <TableHead className="text-right">שנה</TableHead>
                <TableHead className="text-right">צבע</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תאריך יצירה</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="text-right font-medium font-mono">{car.plate_number}</TableCell>
                  <TableCell className="text-right">{car.make || "-"}</TableCell>
                  <TableCell className="text-right">{car.model || "-"}</TableCell>
                  <TableCell className="text-right">{car.year || "-"}</TableCell>
                  <TableCell className="text-right">{car.color || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={car.is_active ? "default" : "secondary"}>
                      {car.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatDate(car.created_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(car)}>
                          <Edit className="mr-2 h-4 w-4" /> ערוך
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(car)}>
                          {car.is_active ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" /> השבת
                            </>
                          ) : (
                            <>
                              <Car className="mr-2 h-4 w-4" /> הפעל
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
                              <AlertDialogTitle className="text-right">מחיקת רכב</AlertDialogTitle>
                              <AlertDialogDescription className="text-right">
                                האם אתה בטוח שברצונך למחוק את הרכב {car.plate_number}?
                                פעולה זו לא ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(car)}
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
            <DialogTitle className="text-right">ערוך רכב</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plate_number" className="text-right block">מספר רכב *</Label>
              <Input
                id="edit-plate_number"
                value={formData.plate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                placeholder="לדוגמה: 12-345-67"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-make" className="text-right block">יצרן</Label>
              <Input
                id="edit-make"
                value={formData.make}
                onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                placeholder="לדוגמה: איווקו, מרצדס"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model" className="text-right block">דגם</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="לדוגמה: Daily, Sprinter"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-year" className="text-right block">שנה</Label>
              <Input
                id="edit-year"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="לדוגמה: 2020"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color" className="text-right block">צבע</Label>
              <Input
                id="edit-color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="לדוגמה: לבן, כחול"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEdit}>
              עדכן רכב
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}