"use client";

// Google Maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Plus,
  Trash2,
  Package,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRouter } from "next/navigation";
import { toDateLocalString, fromDateLocalString } from "@/lib/date-helpers";
import { useToast } from "@/hooks/use-toast";

import type {
  Certificate,
  GoogleMapsAddressComponent,
  Car,
  Driver,
} from "@/lib/types";

export function UploadDeliveryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [certificatesCollapsed, setCertificatesCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    type: "משלוח",
    subtype: "",
    address: "",
    city: "",
    zip_code: "",
    driver: "none",
    car_number: "",
    driver_id: null as number | null,
    car_id: null as number | null,
    date_expected: "",
    metadata: {
      client_name: "",
      phone_number: "",
    },
    certificates: [] as Partial<Certificate>[],
  });

  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressAutocomplete, setAddressAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const fetchCarsAndDrivers = async () => {
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
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת רשימת הרכבים והנהגים",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchCarsAndDrivers();
  }, [toast]);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        if (window.google && window.google.maps) {
          initializeAutocomplete();
        }
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key is missing");
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeAutocomplete();
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
        toast({
          title: "שגיאת Google Maps",
          description: "לא ניתן לטעון את Google Maps API. בדוק את הגדרות החשבון והחיוב",
          variant: "destructive",
        });
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps) return;

    if (addressInputRef.current && !addressAutocomplete) {
      try {
        const addressAuto = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ["geocode"],
            componentRestrictions: { country: "il" },
            fields: ["address_components", "formatted_address", "geometry", "name"],
          },
        );

        addressAuto.addListener("place_changed", () => {
          const place = addressAuto.getPlace();

          if (place.formatted_address) {
            const addressComponents = place.address_components || [];

            let streetNumber = "";
            let route = "";
            let city = "";
            let postalCode = "";
            let sublocality = "";

            addressComponents.forEach((component: GoogleMapsAddressComponent) => {
              const types = component.types;
              if (types.includes("street_number")) {
                streetNumber = component.long_name;
              } else if (types.includes("route")) {
                route = component.long_name;
              } else if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
                sublocality = component.long_name;
              } else if (types.includes("locality") || types.includes("administrative_area_level_2") || types.includes("administrative_area_level_1")) {
                if (!city) {
                  city = component.long_name;
                }
              } else if (types.includes("postal_code")) {
                postalCode = component.long_name;
              }
            });

            const finalCity = city || sublocality;
            const streetAddress = `${route} ${streetNumber}`.trim();
            const fullAddress = finalCity ? `${streetAddress}, ${finalCity}` : streetAddress;

            setFormData((prev) => ({
              ...prev,
              address: fullAddress || place.formatted_address || "",
              city: finalCity || "",
              zip_code: postalCode || prev.zip_code,
            }));
          }
        });

        setAddressAutocomplete(addressAuto);
      } catch (error) {
        console.error("Google Maps Places API Error:", error);
        toast({
          title: "שגיאה ב-Google Maps",
          description: "לא ניתן לטעון את שירות ההשלמה האוטומטית של הכתובות",
          variant: "destructive",
        });
      }
    }

  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missionData = {
      type: formData.type,
      subtype: formData.subtype,
      address: {
        address: formData.address,
        city: formData.city,
        zip_code: formData.zip_code,
      },
      driver: formData.driver,
      car_number: formData.car_number,
      date_expected: formData.date_expected,
      certificates: formData.certificates,
      metadata: formData.metadata,
    };

    if (
      !missionData.type ||
      !missionData.address.address ||
      !missionData.address.city ||
      !formData.car_id
    ) {
      toast({
        title: "שגיאה בטופס",
        description: "אנא מלא את כל השדות הנדרשים (כולל בחירת רכב)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formData.type,
          subtype: formData.subtype || null,
          address: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            zip_code: formData.zip_code || "",
          },
          driver_id: formData.driver_id,
          car_id: formData.car_id,
          driver: formData.driver && formData.driver !== "none" ? formData.driver : null,
          car_number: formData.car_number || null,
          date_expected: formData.date_expected ? fromDateLocalString(formData.date_expected) : null,
          metadata: {
            client_name: formData.metadata.client_name || null,
            phone_number: formData.metadata.phone_number || null,
          },
          certificates:
            formData.certificates.length > 0 ? formData.certificates : null,
        }),
      });

      if (response.ok) {
        const newMission = await response.json();

        toast({
          title: "הצלחה!",
          description: `משימה #${newMission.id} נוצרה בהצלחה`,
          variant: "default",
        });

        setFormData({
          type: "משלוח",
          subtype: "",
          address: "",
          city: "",
          zip_code: "",
          driver: "none",
          car_number: "",
          driver_id: null,
          car_id: null,
          date_expected: "",
          metadata: {
            client_name: "",
            phone_number: "",
          },
          certificates: [],
        });

        setTimeout(() => {
          router.push("/deliveries");
        }, 1200);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mission");
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description:
          error instanceof Error ? error.message : "שגיאה ביצירת המשימה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
          type: "delivery",
          certificate_number: "",
          packages_count: 1,
          notes: "",
        },
      ],
    }));
  };

  const removeCertificate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const updateCertificate = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.map((cert, i) => {
        return i === index ? { ...cert, [field]: value } : cert;
      }),
    }));
  };

  return (
    <div className="max-w-[1200px] mx-auto -mt-4 p-4 sm:p-6 lg:p-8 pb-0">
      <div className="relative">
        <div className="absolute inset-0 -z-10 opacity-40 bg-gradient-to-tl from-primary/10 via-transparent to-purple-500/10 rounded-2xl blur-2xl" />
        <Card className="overflow-hidden backdrop-blur-sm border-border/60 shadow-lg" dir="rtl">
          <CardHeader className="bg-gradient-to-b from-muted/50 to-transparent border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">יצירת משימה חדשה</CardTitle>
                <CardDescription>מלא את פרטי המשימה והוסף תעודות משלוח</CardDescription>
              </div>
              <div className="hidden md:block" />
            </div>
          </CardHeader>
           <CardContent className="p-0">
             <div className="p-4 sm:p-6">
               <div className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`space-y-2 ${formData.type === "מנופים" ? "md:order-1" : ""}`}>
                        <Label htmlFor="type" className="text-right block">סוג משימה *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              type: value,
                              subtype: value === "מנופים" ? prev.subtype : "",
                            }));
                          }}
                        >
                          <SelectTrigger className="text-right"><SelectValue placeholder="בחר סוג משימה" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="משלוח">משלוח</SelectItem>
                            <SelectItem value="חשבונית">חשבונית</SelectItem>
                            <SelectItem value="מנופים">מנופים</SelectItem>
                            <SelectItem value="משימה">משימה</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.type === "מנופים" && (
                        <div className="space-y-2 md:order-2">
                          <Label htmlFor="subtype" className="text-right block">תת-סוג *</Label>
                          <Select value={formData.subtype} onValueChange={(value) => setFormData((prev) => ({ ...prev, subtype: value }))}>
                            <SelectTrigger className="text-right"><SelectValue placeholder="בחר תת-סוג" /></SelectTrigger>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:order-1">
                        <Label htmlFor="client_name" className="text-right block">שם לקוח (אופציונלי)</Label>
                        <Input id="client_name" value={formData.metadata.client_name} onChange={(e) => setFormData((prev) => ({ ...prev, metadata: { ...prev.metadata, client_name: e.target.value } }))} placeholder="שם הלקוח" className="text-right" />
                      </div>
                      <div className="space-y-2 md:order-2">
                        <Label htmlFor="phone_number" className="text-right block">מספר טלפון (אופציונלי)</Label>
                        <Input id="phone_number" value={formData.metadata.phone_number} onChange={(e) => setFormData((prev) => ({ ...prev, metadata: { ...prev.metadata, phone_number: e.target.value } }))} placeholder="מספר טלפון ליצירת קשר" className="text-right" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_address" className="text-right block">כתובת מלאה *</Label>
                      <Input ref={addressInputRef} id="full_address" required value={formData.address} onChange={(e) => { const value = e.target.value; setFormData((prev) => ({ ...prev, address: value })); }} placeholder="מקור 440, תל אביב" className="text-right" />
                      <p className="text-xs text-muted-foreground text-right">התחל להקליד כתובת כולל עיר (למשל: מקור 440, תל אביב)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:order-2">
                        <Label htmlFor="zip_code" className="text-right block">מיקוד (אופציונלי)</Label>
                        <Input id="zip_code" value={formData.zip_code} onChange={(e) => setFormData((prev) => ({ ...prev, zip_code: e.target.value }))} placeholder="הכנס מיקוד" className="text-right" />
                      </div>
                      <div className="space-y-2 md:order-1">
                        <Label htmlFor="driver" className="text-right block">נהג *</Label>
                        <Select value={formData.driver} onValueChange={(value) => {
                          if (value === "none") {
                            setFormData((prev) => ({ ...prev, driver: "none", driver_id: null }));
                          } else {
                            const selectedDriver = drivers.find(d => d.name === value);
                            setFormData((prev) => ({ ...prev, driver: value, driver_id: selectedDriver?.id || null }));
                          }
                        }}>
                          <SelectTrigger className="text-right"><SelectValue placeholder={loadingData ? "טוען נהגים..." : "בחר נהג"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">ללא נהג</SelectItem>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.name}>
                                {driver.name}
                                {driver.phone && ` (${driver.phone})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:order-2">
                        <Label htmlFor="date_expected" className="text-right block">תאריך צפוי *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-between text-right font-normal", !formData.date_expected && "text-muted-foreground")}>
                              <CalendarIcon className="h-4 w-4" />
                              {formData.date_expected ? (
                                new Date(formData.date_expected).toLocaleDateString()
                              ) : (
                                <span>בחר תאריך</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={formData.date_expected ? new Date(formData.date_expected) : undefined}
                              onSelect={(date) => setFormData((prev) => ({ ...prev, date_expected: date ? toDateLocalString(date) : "" }))}
                              fromDate={new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2 md:order-1">
                        <Label htmlFor="car_number" className="text-right block">רכב *</Label>
                        <Select value={formData.car_number} onValueChange={(value) => { const selectedCar = cars.find(c => c.plate_number === value); setFormData((prev) => ({ ...prev, car_number: value, car_id: selectedCar?.id || null })); }} required>
                          <SelectTrigger className="text-right"><SelectValue placeholder={loadingData ? "טוען רכבים..." : "בחר רכב"} /></SelectTrigger>
                          <SelectContent>
                            {cars.map((car) => (
                              <SelectItem key={car.id} value={car.plate_number}>
                                {car.plate_number}
                                {car.make && car.model && ` - ${car.make} ${car.model}`}
                                {car.year && ` (${car.year})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </form>

                  <div className="mt-6">
                    <Collapsible 
                      open={!certificatesCollapsed} 
                      onOpenChange={(open) => setCertificatesCollapsed(!open)}
                      className="rounded-xl border bg-muted/20"
                    >
                      <div className="flex items-center justify-between p-4 border-b bg-card/60">
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger className="flex items-center gap-2 hover:bg-muted/50 rounded p-2 transition-colors">
                            {certificatesCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                            <h3 className="text-lg font-medium flex items-center gap-2">
                              <Package className="h-5 w-5" />
                              תעודות משלוח
                            </h3>
                          </CollapsibleTrigger>
                        </div>
                        <div className="flex items-center gap-2">
                          {certificatesCollapsed && (
                            <span className="text-sm text-muted-foreground">
                              ({formData.certificates.length} תעודות)
                            </span>
                          )}
                          <Button type="button" size="sm" onClick={addCertificate}>
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent>
                        {formData.certificates.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">אין תעודות עדיין</p>
                            <p className="text-xs">לחץ על "הוסף" כדי להתחיל</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {formData.certificates.map((certificate, index) => (
                              <div key={index} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground truncate">{certificate.certificate_number || "ללא מספר"}</span>
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">תעודה #{index + 1}</span>
                                    </div>
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCertificate(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3">
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-1">
                                      <Label className="text-right block text-xs">חבילות *</Label>
                                      <Input type="text" value={certificate.packages_count || ""} onChange={(e) => { const value = e.target.value.replace(/[^0-9]/g, ""); updateCertificate(index, "packages_count", value ? parseInt(value) : 0); }} placeholder="0" className="text-right h-9" />
                                    </div>
                                    <div className="col-span-1">
                                      <Label className="text-right block text-xs">מס' תעודה</Label>
                                      <Input value={certificate.certificate_number || ""} onChange={(e) => updateCertificate(index, "certificate_number", e.target.value)} placeholder="12345" className="text-right h-9" />
                                    </div>
                                    <div className="col-span-1">
                                      <Label className="text-right block text-xs">סוג</Label>
                                      <Select value={(certificate.type === 'delivery' || certificate.type === 'return') ? certificate.type : (certificate.type ? 'other' : 'delivery')} onValueChange={(value) => {
                                        if (value === 'other') {
                                          updateCertificate(index, 'type', certificate.type && certificate.type !== 'delivery' && certificate.type !== 'return' ? certificate.type : '');
                                        } else {
                                          updateCertificate(index, 'type', value);
                                        }
                                      }}>
                                        <SelectTrigger className="text-right h-9"><SelectValue placeholder="בחר סוג" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="delivery">ת. משלוח</SelectItem>
                                          <SelectItem value="return">ת. החזרה</SelectItem>
                                          <SelectItem value="other">אחר</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {(!(certificate.type === 'delivery' || certificate.type === 'return') ) && (
                                        <div className="mt-2">
                                          <Label className="text-right block text-xs">סוג מותאם</Label>
                                          <Input value={certificate.type || ''} onChange={(e) => updateCertificate(index, 'type', e.target.value)} placeholder="כתוב סוג" className="text-right h-9" />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-right block text-xs">הערות</Label>
                                    <Textarea value={certificate.notes || ""} onChange={(e) => updateCertificate(index, "notes", e.target.value)} placeholder="הערות נוספות..." className="text-right min-h-[56px] text-sm" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CollapsibleContent>

                      {/* Collapsed scrollable view */}
                      {certificatesCollapsed && formData.certificates.length > 0 && (
                        <div className="border-t">
                          <ScrollArea className="h-48 p-4">
                            <div className="space-y-3">
                              {formData.certificates.map((certificate, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCertificate(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className="text-xs text-muted-foreground">({certificate.packages_count || 0} חבילות)</span>
                                      <span className="text-sm font-medium truncate">{certificate.certificate_number || "ללא מספר"}</span>
                                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">#{index + 1}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate text-right">
                                      {certificate.type === 'delivery' ? 'ת. משלוח' : certificate.type === 'return' ? 'ת. החזרה' : certificate.type || 'ללא סוג'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </Collapsible>
                  </div>

                  <div className="mt-6">
                    <Button type="submit" onClick={handleSubmit} className="w-full h-11" disabled={loading} size="lg">
                      <Upload className="ml-2 h-4 w-4" />
                      {loading ? "יוצר..." : "צור משימה"}
                    </Button>
                  </div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
