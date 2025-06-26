"use client";

// Google Maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

import React, { useState, useEffect } from "react";
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
import { formatDate, toDateLocalString, fromDateLocalString } from "@/lib/date-helpers";
import type { Mission, Car, Driver, Certificate } from "@/lib/types";
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';

interface MissionEditModalProps {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MissionEditModal({ mission, open, onOpenChange, onSuccess }: MissionEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addressValue, setAddressValue] = useState<{ label: string; value: any } | null>(null);

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
      const initialAddress = parsedAddress?.address || parsedAddress?.street || "";
      const initialCity = parsedAddress?.city || "";
      const initialZip = parsedAddress?.zip_code || "";
      
      setFormData({
        type: mission.type || "",
        subtype: mission.subtype || "",
        address: initialAddress,
        city: initialCity,
        zip_code: initialZip,
        driver_id: mission.driver_id,
        car_id: mission.car_id,
        date_expected: mission.date_expected ? toDateLocalString(mission.date_expected) : "",
        status: mission.status || "unassigned",
        metadata: {
          client_name: mission.metadata?.client_name || "",
          phone_number: mission.metadata?.phone_number || "",
          notes: mission.metadata?.notes || "",
        },
        certificates: mission.certificates || [],
      });

      if (initialAddress) {
        setAddressValue({
          label: initialAddress,
          value: {
            description: initialAddress,
            place_id: `initial-${mission.id}`,
          },
        });
      } else {
        setAddressValue(null);
      }
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

  const handleSubmit = async () => {
    if (!mission) return;
    
    setLoading(true);
    try {
      const updateData = {
        type: formData.type,
        subtype: formData.subtype || null,
        address: {
          address: formData.address,
          city: formData.city,
          zip_code: formData.zip_code,
        },
        driver: formData.driver_id != null
          ? drivers.find((d) => d.id === formData.driver_id)?.name || null
          : null,
        car_number: formData.car_id != null
          ? cars.find((c) => c.id === formData.car_id)?.plate_number || null
          : null,
        driver_id: formData.driver_id,
        car_id: formData.car_id,
        date_expected: formData.date_expected
          ? fromDateLocalString(formData.date_expected)
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
            <div className="grid grid-cols-1 gap-4">
              {formData.type === "מנופים" && (
                <div>
                  <Label htmlFor="subtype" className="text-right block mb-2">תת-סוג *</Label>
                  <Select value={formData.subtype} onValueChange={(value) => setFormData(prev => ({ ...prev, subtype: value }))}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר תת-סוג" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="אספקת מנופים">אספקת מנופים</SelectItem>
                      <SelectItem value="איסוף מנופים">איסוף מנופים</SelectItem>
                      <SelectItem value="הצבה בלבד">הצבה בלבד</SelectItem>
                      <SelectItem value="בהדרכה בלבד">בהדרכה בלבד</SelectItem>
                      <SelectItem value="אספקת מנסרה">אספקת מנסרה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="type" className="text-right block mb-2">סוג משימה *</Label>
                <Select value={formData.type} onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    type: value,
                    subtype: value === "מנופים" ? prev.subtype : "",
                  }));
                }}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר סוג משימה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="משלוח">משלוח</SelectItem>
                    <SelectItem value="חשבונית">חשבונית</SelectItem>
                    <SelectItem value="מנופים">מנופים</SelectItem>
                    <SelectItem value="מסימה">מסימה</SelectItem>
                    <SelectItem value="איסוף">איסוף</SelectItem>
                    <SelectItem value="ביקור">ביקור</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-right block mb-2">סטטוס</Label>
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
              <Label className="text-right block mb-2">תאריך ביצוע צפוי</Label>
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
                      ? formatDate(new Date(formData.date_expected + 'T00:00:00'))
                      : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_expected ? new Date(formData.date_expected + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      setFormData(prev => ({
                        ...prev,
                        date_expected: date ? toDateLocalString(date) : "",
                      }));
                      setCalendarOpen(false);
                    }}
                    fromDate={new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Address & Assignment */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_address" className="text-right block mb-2">כתובת מלאה *</Label>
              <div className="relative">
                <GooglePlacesAutocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  apiOptions={{ language: "iw", region: "il" }}
                  selectProps={{
                    value: addressValue,
                    onChange: (place) => {
                      setAddressValue(place);

                      if (place && place.value) {
                        const addressComponents = place.value.address_components || [];
                        let streetNumber = "", route = "", city = "", postalCode = "", sublocality = "";
                        
                        addressComponents.forEach((component: any) => {
                          const types = component.types;
                          if (types.includes("street_number")) streetNumber = component.long_name;
                          else if (types.includes("route")) route = component.long_name;
                          else if (types.includes("sublocality") || types.includes("sublocality_level_1")) sublocality = component.long_name;
                          else if (types.includes("locality") || types.includes("administrative_area_level_2") || types.includes("administrative_area_level_1")) {
                            if (!city) city = component.long_name;
                          } else if (types.includes("postal_code")) postalCode = component.long_name;
                        });

                        const finalCity = city || sublocality;
                        const streetAddress = `${route} ${streetNumber}`.trim();
                        const fullAddress = finalCity ? `${streetAddress}, ${finalCity}` : streetAddress;

                        setFormData((prev) => ({
                          ...prev,
                          address: fullAddress || place.label || "",
                          city: finalCity || "",
                          zip_code: postalCode || prev.zip_code,
                        }));
                      } else {
                        setFormData((prev) => ({ ...prev, address: '', city: '', zip_code: '' }));
                      }
                    },
                    placeholder: "מקור 440, תל אביב",
                    styles: {
                      input: (provided) => ({
                        ...provided,
                        color: 'black',
                        textAlign: 'right',
                        paddingLeft: '2.5rem',
                      }),
                      option: (provided) => ({
                        ...provided,
                        color: 'black',
                        textAlign: 'right',
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        color: 'black',
                      }),
                    },
                  }}
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                התחל להקליד כתובת כולל עיר (למשל: מקור 440, תל אביב)
              </p>
            </div>

            <div>
              <Label htmlFor="zip_code" className="text-right block mb-2">מיקוד</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="מיקוד"
                className="text-right"
              />
            </div>

            <div>
              <Label htmlFor="driver" className="text-right block mb-2">נהג</Label>
              <Select value={formData.driver__id?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value === "none" ? null : parseInt(value) }))}>
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
              <Label htmlFor="car" className="text-right block mb-2">רכב</Label>
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
            <Label htmlFor="client_name" className="text-right block mb-2">שם לקוח</Label>
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
            <Label htmlFor="phone_number" className="text-right block mb-2">טלפון</Label>
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
