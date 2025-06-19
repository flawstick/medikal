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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Edit,
  X,
  Plus,
  Trash2,
  Package,
  CalendarIcon,
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { read, utils } from "xlsx";
import type {
  Certificate,
  GoogleMapsPlace,
  GoogleMapsAddressComponent,
  Car,
  Driver,
} from "@/lib/types";

export function UploadDeliveryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState("manual");
  const [file, setFile] = useState<File | null>(null);
  const [parsedMissions, setParsedMissions] = useState<ParsedMission[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingData, setLoadingData] = useState(true);
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

  // Autocomplete refs
  const addressInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [addressAutocomplete, setAddressAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [cityAutocomplete, setCityAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // Fetch cars and drivers data on mount
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
        console.error('Error fetching cars and drivers:', error);
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

  // Load Google Maps script separately
  useEffect(() => {
    // Check if Google Maps script is already loaded
    const loadGoogleMapsScript = () => {
      // Prevent multiple script loads
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.warn("Google Maps script already loaded");
        if (window.google && window.google.maps) {
          initializeAutocomplete();
        }
        return;
      }

      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn(
          "Google Maps API key not found. Autocomplete will not be available.",
        );
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
        console.error("Failed to load Google Maps API");
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    // Cleanup function to prevent multiple loads
    return () => {
      // Optional: Remove event listeners if any
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps) return;

    // Address autocomplete
    if (addressInputRef.current && !addressAutocomplete) {
      const addressAuto = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "il" },
        },
      );

      addressAuto.addListener("place_changed", () => {
        const place = addressAuto.getPlace();
        if (place.formatted_address) {
          const addressComponents = place.address_components || [];

          // Extract address details
          let streetNumber = "";
          let route = "";
          let city = "";
          let postalCode = "";

          addressComponents.forEach((component: GoogleMapsAddressComponent) => {
            const types = component.types;
            if (types.includes("street_number")) {
              streetNumber = component.long_name;
            } else if (types.includes("route")) {
              route = component.long_name;
            } else if (types.includes("locality")) {
              city = component.long_name;
            } else if (types.includes("postal_code")) {
              postalCode = component.long_name;
            }
          });

          const fullAddress = `${route} ${streetNumber}`.trim();

          setFormData((prev) => ({
            ...prev,
            address: fullAddress || place.formatted_address || "",
            city: city || prev.city,
            zip_code: postalCode || prev.zip_code,
          }));
        }
      });

      setAddressAutocomplete(addressAuto);
    }

    // City autocomplete
    if (cityInputRef.current && !cityAutocomplete) {
      const cityAuto = new window.google.maps.places.Autocomplete(
        cityInputRef.current,
        {
          types: ["(cities)"],
          componentRestrictions: { country: "il" },
        },
      );

      cityAuto.addListener("place_changed", () => {
        const place = cityAuto.getPlace();
        if (place.name) {
          setFormData((prev) => ({
            ...prev,
            city: place.name || "",
          }));
        }
      });

      setCityAutocomplete(cityAuto);
    }
  };

  interface ParsedMission {
    type: string;
    subtype: string;
    address: string;
    city: string;
    zip_code: string;
    driver: string;
    car_number: string;
    date_expected: string;
    certificates: any[];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create mission data object for validation
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

    // Basic validation
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
          // Keep backward compatibility fields for now
          driver: formData.driver && formData.driver !== "none" ? formData.driver : null,
          car_number: formData.car_number || null,
          date_expected: formData.date_expected || null,
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

        // Show success toast
        toast({
          title: "הצלחה!",
          description: `משימה #${newMission.id} נוצרה בהצלחה`,
          variant: "default",
        });

        // Reset form
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

        // Redirect to deliveries page after a short delay
        setTimeout(() => {
          router.push("/deliveries");
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mission");
      }
    } catch (error) {
      console.error("Error creating mission:", error);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      await parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      if (
        file.type.includes("sheet") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        await parseExcelFile(file);
      } else if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        await parseCsvFile(file);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעיבוד הקובץ",
        variant: "destructive",
      });
    }
  };

  const parseExcelFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row and process data
    const missions = (jsonData as any[])
      .slice(1)
      .map((row: any[]) => ({
        type: row[0] || "משלוח",
        subtype: row[1] || "",
        address: row[2] || "",
        city: row[3] || "",
        zip_code: row[4] || "",
        driver: row[5] || "",
        car_number: row[6] || "",
        date_expected: row[7] || "",
        certificates: [],
      }))
      .filter((mission) => mission.address.trim() && mission.city.trim()); // Only include missions with required fields

    setParsedMissions(missions);
    setShowPreview(true);
  };

  const parseCsvFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n");
    const missions = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((val) => val.trim());
        return {
          type: values[0] || "משלוח",
          subtype: values[1] || "",
          address: values[2] || "",
          city: values[3] || "",
          zip_code: values[4] || "",
          driver: values[5] || "",
          car_number: values[6] || "",
          date_expected: values[7] || "",
          certificates: [],
        };
      })
      .filter((mission) => mission.address.trim() && mission.city.trim()); // Only include missions with required fields

    setParsedMissions(missions);
    setShowPreview(true);
  };

  const handleConfirmMissions = async () => {
    if (parsedMissions.length === 0) {
      toast({
        title: "שגיאה",
        description: "אין משימות לאישור",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        parsedMissions.map(async (mission) => {
          // Convert driver name to driver_id
          const driver_id = mission.driver 
            ? drivers.find(d => d.name === mission.driver)?.id || null
            : null;

          // Convert car_number to car_id
          const car_id = mission.car_number 
            ? cars.find(c => c.plate_number === mission.car_number)?.id || null
            : null;

          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: mission.type,
              subtype: mission.subtype || null,
              address: {
                address: mission.address.trim(),
                city: mission.city.trim(),
                zip_code: mission.zip_code || "",
              },
              driver: mission.driver || null,
              car_number: mission.car_number || null,
              driver_id: driver_id,
              car_id: car_id,
              date_expected: mission.date_expected || null,
              certificates:
                mission.certificates.length > 0 ? mission.certificates : null,
            }),
          });
          return response.ok;
        }),
      );

      const successCount = results.filter(Boolean).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "הצלחה!",
          description: `${successCount} משימות נוצרו בהצלחה${failureCount > 0 ? `, ${failureCount} נכשלו` : ""}`,
          variant: "default",
        });

        // Reset state
        setFile(null);
        setParsedMissions([]);
        setShowPreview(false);

        setTimeout(() => {
          router.push("/deliveries");
        }, 1500);
      } else {
        throw new Error("כל המשימות נכשלו");
      }
    } catch (error) {
      console.error("Error creating missions:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת המשימות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMission = (index: number) => {
    setParsedMissions((missions) => missions.filter((_, i) => i !== index));
  };

  const resetFileUpload = () => {
    setFile(null);
    setParsedMissions([]);
    setShowPreview(false);
  };

  // Certificate management functions
  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
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
      certificates: prev.certificates.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert,
      ),
    }));
  };

  return (
    <Card
      className={`flex-1 flex flex-col shadow-sm w-[1200px] mx-auto h-full transition-all duration-300 overflow-hidden`}
    >
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="text-right text-2xl">יצירת משימה חדשה</CardTitle>
        <CardDescription className="text-right">
          בחר את סוג ההעלאה המועדף עליך
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              ידני
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="space-y-6 mt-6">
            <div className="space-y-6">
              {!showPreview ? (
                <>
                  <fieldset>
                    <legend className="sr-only">העלאת קובץ Excel</legend>
                    <div className="relative">
                      <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-8 bg-muted/20">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 rounded-full bg-primary/10">
                            <FileSpreadsheet
                              className="h-8 w-8 text-primary"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="text-center space-y-2">
                            <Label
                              htmlFor="excel-file"
                              className="text-base font-medium cursor-pointer hover:text-primary transition-colors"
                            >
                              העלה קובץ <span lang="en">Excel</span>
                            </Label>
                            <p
                              className="text-sm text-muted-foreground"
                              id="excel-help"
                            >
                              גרור קובץ לכאן או לחץ לבחירה. תומך בקבצי .xlsx
                              ו-.xls
                            </p>
                          </div>
                          <Input
                            id="excel-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-describedby="excel-help"
                            aria-label="בחר קובץ Excel להעלאה"
                          />
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  {file && (
                    <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3 text-right">
                      פורמט נדרש:
                    </h4>
                    <div className="space-y-2 text-right text-sm text-muted-foreground">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה A: סוג משימה *
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה B: תת-סוג
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה C: כתובת *
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה D: עיר *
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה E: מיקוד
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה F: נהג
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה G: מספר רכב
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          עמודה H: תאריך צפוי
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        * שדות חובה. תעודות יתווספו באופן ידני לאחר היצירה
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      תצוגה מקדימה - {parsedMissions.length} משימות
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFileUpload}
                    >
                      <X className="h-4 w-4 ml-2" />
                      בטל
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            סוג משימה
                          </TableHead>
                          <TableHead className="text-right">תת-סוג</TableHead>
                          <TableHead className="text-right">כתובת</TableHead>
                          <TableHead className="text-right">עיר</TableHead>
                          <TableHead className="text-right">תעודות</TableHead>
                          <TableHead className="text-right">נהג</TableHead>
                          <TableHead className="text-right">רכב</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedMissions.map((mission, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-right font-medium">
                              {mission.type}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.subtype || (
                                <span className="text-muted-foreground">
                                  לא צוין
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.address}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.city}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.certificates?.length || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.driver || (
                                <span className="text-muted-foreground">
                                  לא צוין
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.car_number || (
                                <span className="text-muted-foreground">
                                  לא צוין
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMission(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button
                    onClick={handleConfirmMissions}
                    className="w-full h-11"
                    disabled={loading || parsedMissions.length === 0}
                    size="lg"
                  >
                    <CheckCircle className="ml-2 h-4 w-4" />
                    {loading
                      ? "יוצר משימות..."
                      : `אשר ויצור ${parsedMissions.length} משימות`}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-6 mt-6">
            <div className="space-y-6">
              {!showPreview ? (
                <>
                  <div className="relative">
                    <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-8 bg-muted/20">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                          <Label
                            htmlFor="csv-file"
                            className="text-base font-medium cursor-pointer hover:text-primary transition-colors"
                          >
                            העלה קובץ CSV
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            גרור קובץ לכאן או לחץ לבחירה
                          </p>
                        </div>
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    {file && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3 text-right">
                      פורמט נדרש (מופרד בפסיקים):
                    </h4>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <code className="text-sm font-mono text-foreground block text-center">
                        סוג משימה,תת-סוג,כתובת,עיר,מיקוד,נהג,מספר רכב,תאריך צפוי
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      השורה הראשונה צריכה להכיל את כותרות העמודות. סוג משימה,
                      כתובת ועיר הם שדות חובה. תעודות יתווספו באופן ידני
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      תצוגה מקדימה - {parsedMissions.length} משימות
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFileUpload}
                    >
                      <X className="h-4 w-4 ml-2" />
                      בטל
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            סוג משימה
                          </TableHead>
                          <TableHead className="text-right">תת-סוג</TableHead>
                          <TableHead className="text-right">כתובת</TableHead>
                          <TableHead className="text-right">עיר</TableHead>
                          <TableHead className="text-right">תעודות</TableHead>
                          <TableHead className="text-right">נהג</TableHead>
                          <TableHead className="text-right">רכב</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedMissions.map((mission, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-right font-medium">
                              {mission.type}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.subtype || (
                                <span className="text-muted-foreground">
                                  לא צוין
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.address}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.city}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.certificates?.length || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.driver || (
                                <span className="text-muted-foreground">
                                  לא צוין
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {mission.car_number || (
                                <span className="text-muted-foreground">
                                  לא צוין
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMission(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button
                    onClick={handleConfirmMissions}
                    className="w-full h-11"
                    disabled={loading || parsedMissions.length === 0}
                    size="lg"
                  >
                    <CheckCircle className="ml-2 h-4 w-4" />
                    {loading
                      ? "יוצר משימות..."
                      : `אשר ויצור ${parsedMissions.length} משימות`}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 h-full flex flex-col"
            >
              <div className="space-y-4">
                {/* Type field - alone unless מנופים is selected */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.type === "מנופים" && (
                    <div className="space-y-2 md:order-1">
                      <Label htmlFor="subtype" className="text-right block">
                        תת-סוג *
                      </Label>
                      <Select
                        value={formData.subtype}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, subtype: value }))
                        }
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר תת-סוג" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="אספקת מנופים">
                            אספקת מנופים
                          </SelectItem>
                          <SelectItem value="איסוף מנופים">
                            איסוף מנופים
                          </SelectItem>
                          <SelectItem value="הצבה בלבד">הצבה בלבד</SelectItem>
                          <SelectItem value="אספקת מנסה">אספקת מנסה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div
                    className={`space-y-2 ${formData.type === "מנופים" ? "md:order-2" : "md:col-start-2"}`}
                  >
                    <Label htmlFor="type" className="text-right block">
                      סוג משימה *
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          type: value,
                          // Reset subtype if not מנופים
                          subtype: value === "מנופים" ? prev.subtype : "",
                        }));
                      }}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="בחר סוג משימה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="משלוח">משלוח</SelectItem>
                        <SelectItem value="חשבונית">חשבונית</SelectItem>
                        <SelectItem value="מנופים">מנופים</SelectItem>
                        <SelectItem value="מסימה">מסימה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Client Name + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:order-2">
                    <Label htmlFor="client_name" className="text-right block">
                      שם לקוח (אופציונלי)
                    </Label>
                    <Input
                      id="client_name"
                      value={formData.metadata.client_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            client_name: e.target.value,
                          },
                        }))
                      }
                      placeholder="שם הלקוח"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2 md:order-1">
                    <Label htmlFor="phone_number" className="text-right block">
                      מספר טלפון (אופציונלי)
                    </Label>
                    <Input
                      id="phone_number"
                      value={formData.metadata.phone_number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            phone_number: e.target.value,
                          },
                        }))
                      }
                      placeholder="מספר טלפון ליצירת קשר"
                      className="text-right"
                    />
                  </div>
                </div>

                {/* Address + City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:order-2">
                    <Label htmlFor="address" className="text-right block">
                      כתובת *
                    </Label>
                    <Input
                      ref={addressInputRef}
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="התחל להקליד כתובת..."
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2 md:order-1">
                    <Label htmlFor="city" className="text-right block">
                      עיר *
                    </Label>
                    <Input
                      ref={cityInputRef}
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="התחל להקליד שם עיר..."
                      className="text-right"
                    />
                  </div>
                </div>

                {/* Zip Code + Driver */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:order-2">
                    <Label htmlFor="zip_code" className="text-right block">
                      מיקוד (אופציונלי)
                    </Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          zip_code: e.target.value,
                        }))
                      }
                      placeholder="הכנס מיקוד"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2 md:order-1">
                    <Label htmlFor="driver" className="text-right block">
                      נהג (אופציונלי)
                    </Label>
                    <Select
                      value={formData.driver}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData((prev) => ({ 
                            ...prev, 
                            driver: "none", 
                            driver_id: null 
                          }));
                        } else {
                          const selectedDriver = drivers.find(d => d.name === value);
                          setFormData((prev) => ({ 
                            ...prev, 
                            driver: value,
                            driver_id: selectedDriver?.id || null
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder={loadingData ? "טוען נהגים..." : "בחר נהג"} />
                      </SelectTrigger>
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

                {/* Expected Date + Car Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:order-2">
                    <Label htmlFor="date_expected" className="text-right block">
                      תאריך צפוי (אופציונלי)
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date_expected && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date_expected ? (
                            new Date(formData.date_expected).toLocaleString()
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.date_expected
                              ? new Date(formData.date_expected)
                              : undefined
                          }
                          onSelect={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              date_expected: date
                                ? date.toISOString().slice(0, 16)
                                : "",
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2 md:order-1">
                    <Label htmlFor="car_number" className="text-right block">
                      רכב *
                    </Label>
                    <Select
                      value={formData.car_number}
                      onValueChange={(value) => {
                        const selectedCar = cars.find(c => c.plate_number === value);
                        setFormData((prev) => ({ 
                          ...prev, 
                          car_number: value,
                          car_id: selectedCar?.id || null
                        }));
                      }}
                      required
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder={loadingData ? "טוען רכבים..." : "בחר רכב"} />
                      </SelectTrigger>
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
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-background"
                      >
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
                                const value = e.target.value.replace(
                                  /[^0-9]/g,
                                  "",
                                );
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

              <div className="flex-shrink-0 pt-4">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                  size="lg"
                >
                  <Upload className="ml-2 h-4 w-4" />
                  {loading ? "יוצר..." : "צור משימה"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
