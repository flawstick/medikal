"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Save, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
    notes: "",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הלקוח הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          contact_person: formData.contact_person.trim() || null,
          notes: formData.notes.trim() || null,
          is_active: formData.is_active,
        }),
      });

      if (response.ok) {
        const newClient = await response.json();

        toast({
          title: "הצלחה!",
          description: `לקוח ${newClient.name} נוצר בהצלחה`,
          variant: "default",
        });

        router.push(`/clients/${newClient.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create client");
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description:
          error instanceof Error ? error.message : "שגיאה ביצירת הלקוח",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6 pt-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
            <Link href="/clients" className="hover:text-foreground">לקוחות</Link>
            <span>/</span>
            <span>לקוח חדש</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3 space-x-reverse">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <span>יצירת לקוח חדש</span>
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/clients">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור
          </Link>
        </Button>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl"
      >
        <Card>
          <CardHeader>
            <CardTitle>פרטי הלקוח</CardTitle>
            <CardDescription>
              מלא את הפרטים הבסיסיים של הלקוח החדש
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם הלקוח *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="הכנס את שם הלקוח"
                    className="text-right"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">מספר טלפון</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="050-1234567"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">כתובת אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="client@example.com"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">כתובת</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="רחוב הרצל 123, תל אביב"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">איש קשר</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleChange("contact_person", e.target.value)}
                    placeholder="שם איש הקשר"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">הערות</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="הערות נוספות על הלקוח..."
                    className="text-right min-h-[100px]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active" className="text-base">
                      לקוח פעיל
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      לקוח פעיל יופיע ברשימות ובחיפושים
                    </div>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange("is_active", checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-6">
                <Button type="button" variant="outline" asChild>
                  <Link href="/clients">ביטול</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 ml-2" />
                  {loading ? "שומר..." : "שמור לקוח"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}