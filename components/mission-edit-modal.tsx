"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, MapPin, Plus, X, Package, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-helpers";
import type { Mission, Car, Driver, Certificate } from "@/lib/types";

interface MissionEditModalProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface GoogleMapsPlace {
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components: GoogleMapsAddressComponent[];
}

interface GoogleMapsAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export function MissionEditModal({ mission, open, onOpenChange, onSuccess }: MissionEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: "",
    subtype: "",
    address: "",
    city: "",
    zip_code: "",
    driver_id: null as number | null,
    car_id: null as number | null,
    date_expected: "",
    status: "",
    metadata: {
      client_name: "",
      phone_number: "",
      notes: "",
    },
    certificates: [] as Partial<Certificate>[],
  });

  // Initialize form data when mission changes
  useEffect(() => {
    if (mission) {
      const parsedAddress = mission.address as any;
      setFormData({
        type: mission.type || "",
        subtype: mission.subtype || "",
        address: parsedAddress?.address || parsedAddress?.street || "",
        city: parsedAddress?.city || "",
        zip_code: parsedAddress?.zip_code || "",
        driver_id: mission.driver_id,
        car_id: mission.car_id,
        date_expected: mission.date_expected ? new Date(mission.date_expected).toISOString().slice(0, 16) : "",
        status: mission.status || "unassigned",
        metadata: {
          client_name: mission.metadata?.client_name || "",
          phone_number: mission.metadata?.phone_number || "",
          notes: mission.metadata?.notes || "",
        },
        certificates: mission.certificates || [],
      });
    }
  }, [mission]);

  // Fetch cars and drivers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [carsResponse, driversResponse] = await Promise.all([
          fetch('/api/cars?status=active'),
          fetch('/api/drivers?status=active')
        ]);

        if (carsResponse.ok) {
          const carsData = await carsResponse.json();
          setCars(carsData);
        }

        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(driversData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (open && typeof window !== "undefined" && window.google && addressInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "IL" },
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place: GoogleMapsPlace = autocomplete.getPlace();
        if (place.formatted_address) {
          let city = "";
          let zipCode = "";

          place.address_components?.forEach((component) => {
            if (component.types.includes("locality")) {
              city = component.long_name;
            }
            if (component.types.includes("postal_code")) {
              zipCode = component.long_name;
            }
          });

          setFormData((prev) => ({
            ...prev,
            address: place.formatted_address,
            city: city,
            zip_code: zipCode,
          }));
        }
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!mission) return;
    
    setLoading(true);
    try {
      // Prepare payload including both driver/car strings and IDs to satisfy update API
      const updateData = {
        type: formData.type,
        subtype: formData.subtype || null,
        address: {
          address: formData.address,
          city: formData.city,
          zip_code: formData.zip_code,
        },
        // String fields (used by UI tables) and numeric IDs (for relationships)
        driver: formData.driver_id != null
          ? drivers.find((d) => d.id === formData.driver_id)?.name || null
          : null,
        car_number: formData.car_id != null
          ? cars.find((c) => c.id === formData.car_id)?.plate_number || null
          : null,
        driver_id: formData.driver_id,
        car_id: formData.car_id,
        date_expected: formData.date_expected
          ? new Date(formData.date_expected).toISOString()
          : null,
        status: formData.status,
        metadata: formData.metadata,
        certificates: formData.certificates,
      };

      const response = await fetch(`/api/orders/${mission.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "הצלחה!",
          description: "המשימה עודכנה בהצלחה",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error("Failed to update mission");
      }
    } catch (error) {
      console.error("Error updating mission:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון המשימה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCertificate = () => {
    setFormData(prev => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        { certificate_number: "", packages_count: 1, notes: "" }
      ],
    }));
  };

  const removeCertificate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const updateCertificate = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת משימה #{mission.id}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="type" className="text-right block">סוג משימה *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סוג משימה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="משלוח">משלוח</SelectItem>
                  <SelectItem value="איסוף">איסוף</SelectItem>
                  <SelectItem value="ביקור">ביקור</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subtype" className="text-right block">תת-סוג</Label>
              <Input
                id="subtype"
                value={formData.subtype}
                onChange={(e) => setFormData(prev => ({ ...prev, subtype: e.target.value }))}
                placeholder="תת-סוג המשימה"
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-right block">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">ללא הקצאה</SelectItem>
                  <SelectItem value="waiting">ממתין</SelectItem>
                  <SelectItem value="in_progress">בדרך</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                  <SelectItem value="problem">בעיה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block">תאריך ביצוע צפוי</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !formData.date_expected && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.date_expected
                      ? formatDate(new Date(formData.date_expected))
                      : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_expected ? new Date(formData.date_expected) : undefined}
                    onSelect={(date) => {
                      setFormData(prev => ({
                        ...prev,
                        date_expected: date ? date.toISOString().slice(0, 16) : "",
                      }));
                      setCalendarOpen(false);
                    }}
                    fromDate={new Date()} // Allow today and future dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Address & Assignment */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-right block">כתובת *</Label>
              <div className="relative">
                <Input
                  id="address"
                  ref={addressInputRef}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="הכנס כתובת"
                  className="text-right pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-right block">עיר</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="עיר"
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="zip_code" className="text-right block">מיקוד</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder="מיקוד"
                  className="text-right"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="driver" className="text-right block">נהג</Label>
              <Select value={formData.driver_id?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value === "none" ? null : parseInt(value) }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר נהג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא נהג</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="car" className="text-right block">רכב</Label>
              <Select value={formData.car_id?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, car_id: value === "none" ? null : parseInt(value) }))}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר רכב" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא רכב</SelectItem>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id.toString()}>
                      {car.plate_number} - {car.make} {car.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_name" className="text-right block">שם לקוח</Label>
            <Input
              id="client_name"
              value={formData.metadata.client_name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, client_name: e.target.value }
              }))}
              placeholder="שם הלקוח"
              className="text-right"
            />
          </div>
          <div>
            <Label htmlFor="phone_number" className="text-right block">טלפון</Label>
            <Input
              id="phone_number"
              value={formData.metadata.phone_number}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, phone_number: e.target.value }
              }))}
              placeholder="מספר טלפון"
              className="text-right"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes" className="text-right block">הערות</Label>
          <Textarea
            id="notes"
            value={formData.metadata.notes}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              metadata: { ...prev.metadata, notes: e.target.value }
            }))}
            placeholder="הערות נוספות"
            className="text-right"
            rows={3}
          />
        </div>

        {/* Certificates Section */}
        <div className="flex-1 space-y-3 border rounded-lg p-3 bg-muted/20 min-h-0">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCertificate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              הוסף תעודה
            </Button>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5" />
              תעודות משלוח
            </h3>
          </div>

          {formData.certificates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">לא הוגדרו תעודות משלוח</p>
              <p className="text-xs">לחץ על "הוסף תעודה" כדי להתחיל</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.certificates.map((certificate, index) => (
                <div key={index} className="border rounded-lg p-3 bg-background">
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertificate(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <h4 className="font-medium text-sm">
                      תעודה #{index + 1}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-right block text-sm">
                        מספר תעודה
                      </Label>
                      <Input
                        value={certificate.certificate_number || ""}
                        onChange={(e) =>
                          updateCertificate(
                            index,
                            "certificate_number",
                            e.target.value,
                          )
                        }
                        placeholder="הכנס מספר תעודה"
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-right block text-sm">
                        מספר חבילות *
                      </Label>
                      <Input
                        type="text"
                        value={certificate.packages_count || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          updateCertificate(
                            index,
                            "packages_count",
                            value ? parseInt(value) : 0,
                          );
                        }}
                        placeholder="מספר חבילות"
                        className="text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Label className="text-right block text-sm">
                      הערות (אופציונלי)
                    </Label>
                    <Textarea
                      value={certificate.notes || ""}
                      onChange={(e) =>
                        updateCertificate(index, "notes", e.target.value)
                      }
                      placeholder="הערות נוספות על התעודה..."
                      className="text-right min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "שומר..." : "שמור שינויים"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}