"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, Package, User } from "lucide-react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { MissionActions } from "@/components/mission-actions";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import ExifReader from "exifreader";
import { Clipboard, Plus, MapPin, Calendar } from "lucide-react";

interface Mission {
  id: number;
  type: string;
  subtype: string | null;
  address: {
    address: string;
    city: string;
    zip_code: string;
  };
  driver: string | null;
  car_number: string | null;
  status: "unassigned" | "waiting" | "in_progress" | "completed" | "problem";
  date_expected: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  certificates: any[] | null;
  metadata?: {
    client_name?: string;
    phone_number?: string;
    certificate_images?: any;
    package_images?: string[];
    failure_images?: string[];
    failure_location?: { lat: number; lng: number };
    failure_reason?: string;
    date_failed?: string;
    reported?: boolean;
    reported_to?: string;
    register_location?: { latitude: number; longitude: number };
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "waiting":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "problem":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "unassigned":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "הושלם";
    case "in_progress":
      return "בדרך";
    case "waiting":
      return "ממתין";
    case "problem":
      return "בעיה";
    case "unassigned":
      return "ללא הקצאה";
    default:
      return status;
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("he-IL"),
    time: date.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const R2_PUBLIC_URL =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://pub-935a9967c0664658862019699749d4f6.r2.dev";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exifData, setExifData] = useState<any>({});

  const getExifData = async (imageUrl: string) => {
    if (exifData[imageUrl]) return;

    setExifData((prev) => ({ ...prev, [imageUrl]: { loading: true } }));

    try {
      const response = await fetch(`/api/exif?url=${encodeURIComponent(imageUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setExifData((prev) => ({ ...prev, [imageUrl]: data }));
      } else {
        setExifData((prev) => ({ ...prev, [imageUrl]: { error: true } }));
      }
    } catch (err) {
      console.error("Error fetching EXIF data:", err);
      setExifData((prev) => ({ ...prev, [imageUrl]: { error: true } }));
    }
  };

  useEffect(() => {
    fetchMission();
  }, [resolvedParams.id]);

  const fetchMission = async () => {
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setMission(data);
      } else if (response.status === 404) {
        setError("משימה לא נמצאה");
      } else {
        setError("שגיאה בטעינת המשימה");
      }
    } catch (error) {
      console.error("Error fetching mission:", error);
      setError("שגיאה בטעינת המשימה");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="text-right space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Status and Actions Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטי לקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">שם לקוח:</span>
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">טלפון:</span>
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">כתובת:</span>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Package className="h-5 w-5" />
                פרטי משימה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">תעודות:</span>
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">נהג:</span>
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">מספר רכב:</span>
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">תאריך צפוי:</span>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Clock className="h-5 w-5" />
                ציר זמן
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link href="/deliveries">
              <ArrowRight className="ml-2 h-4 w-4" />
              חזרה למשימות
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build date displays
  const createdDate = formatDateTime(mission.created_at);
  const updatedDate = formatDateTime(mission.updated_at);
  const deliveredDate = mission.completed_at
    ? formatDateTime(mission.completed_at)
    : null;
  // Normalize R2 image keys into full public URLs
  const rawPackage = mission.metadata?.package_images || [];
  const packageImages = rawPackage
    .filter((u): u is string => Boolean(u))
    .map((url) => (url.startsWith("http") ? url : `${R2_PUBLIC_URL}/${url}`));
  const rawCertificates = mission.metadata?.certificate_images || [];
  let certificateImages: { url: string; number?: string }[] = [];

  if (Array.isArray(rawCertificates)) {
    // Handle old format (array of strings)
    certificateImages = rawCertificates
      .filter((u): u is string => Boolean(u))
      .map((url) => ({
        url: url.startsWith("http") ? url : `${R2_PUBLIC_URL}/${url}`,
      }));
  } else if (typeof rawCertificates === "object" && rawCertificates !== null) {
    // Handle new format (object with certificate numbers)
    certificateImages = Object.entries(rawCertificates)
      .flatMap(([number, urls]) =>
        (urls as string[])
          .filter((u) => Boolean(u))
          .map((url) => ({
            url: url.startsWith("http") ? url : `${R2_PUBLIC_URL}/${url}`,
            number,
          })),
      )
      .filter((img) => img.url);
  }
  const rawFailure = mission.metadata?.failure_images || [];
  const failureImages = rawFailure
    .filter((u): u is string => Boolean(u))
    .map((url) => (url.startsWith("http") ? url : `${R2_PUBLIC_URL}/${url}`));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight">
            פרטי משימה #{mission.id}
          </h1>
          <p className="text-muted-foreground mt-1">
            {mission.type}
            {mission.subtype && ` - ${mission.subtype}`}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/deliveries">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה למשימות
          </Link>
        </Button>
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge className={`${getStatusColor(mission.status)} px-3 py-1`}>
            {getStatusText(mission.status)}
          </Badge>
          {deliveredDate && (
            <div className="text-sm text-muted-foreground">
              הושלם ב-{deliveredDate.date} בשעה {deliveredDate.time}
            </div>
          )}
        </div>
        <MissionActions
          mission={mission}
          onUpdate={fetchMission}
          showLabels={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטי לקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">שם לקוח:</span>
                <span className="font-medium">
                  {mission.metadata?.client_name || (
                    <span className="text-muted-foreground">לא צוין</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">טלפון:</span>
                <span className="font-medium">
                  {mission.metadata?.phone_number ? (
                    <a
                      href={`tel:${mission.metadata.phone_number}`}
                      className="text-blue-600 hover:underline"
                    >
                      {mission.metadata.phone_number}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">לא צוין</span>
                  )}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">כתובת:</span>
                <span className="font-medium text-right max-w-60">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${mission.address.address}, ${mission.address.city}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {mission.address.address}
                    <br />
                    {mission.address.city} {mission.address.zip_code}
                  </a>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Package className="h-5 w-5" />
              פרטי משימה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">תעודות:</span>
                <span className="font-medium">
                  {mission.certificates?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">נהג:</span>
                <span className="font-medium">
                  {mission.driver || (
                    <span className="text-muted-foreground">לא הוקצה</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">מספר רכב:</span>
                <span className="font-medium">
                  {mission.car_number || (
                    <span className="text-muted-foreground">לא הוקצה</span>
                  )}
                </span>
              </div>
              {mission.date_expected && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">תאריך צפוי:</span>
                  <span className="font-medium">
                    {new Date(mission.date_expected).toLocaleDateString(
                      "he-IL",
                    )}
                  </span>
                </div>
              )}
              {mission.metadata?.register_location && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">מיקום רישום:</span>
                  <a
                    href={`https://maps.google.com/?q=${mission.metadata.register_location.latitude},${mission.metadata.register_location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    פתח במ��ות
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Failure Details */}
        {(mission.metadata?.failure_reason ||
          failureImages.length > 0 ||
          mission.metadata?.failure_location) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                פרטי כשלון
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">תאריך כישלון:</span>
                <span className="font-medium">
                  {mission.metadata?.date_failed
                    ? new Date(mission.metadata.date_failed).toLocaleString(
                        "he-IL",
                        { dateStyle: "short", timeStyle: "short" },
                      )
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">סיבת כישלון:</span>
                <span className="font-medium">
                  {mission.metadata?.failure_reason || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">דווח:</span>
                <span className="font-medium">
                  {mission.metadata?.reported ? "כן" : "לא"}
                </span>
              </div>
              {mission.metadata?.reported && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">לדווח ל:</span>
                  <span className="font-medium">
                    {mission.metadata?.reported_to || "-"}
                  </span>
                </div>
              )}
              {mission.metadata?.failure_location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">מיקום כשלון:</span>
                  <a
                    href={`https://maps.google.com/?q=${mission.metadata.failure_location.lat},${mission.metadata.failure_location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    פתח במפות
                  </a>
                </div>
              )}
              {failureImages.length > 0 && (
                <div className="space-y-2 text-right mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-lg font-medium">
                        תמונות כשלון ({failureImages.length})
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {failureImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="w-24 h-24 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <img
                          src={url}
                          alt={`תמונת כשלון ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-24 h-24 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-180" />
                          <span className="text-xs text-muted-foreground mt-1">
                            הצג הכל
                          </span>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>תמונות כשלון</DialogTitle>
                        </DialogHeader>
                        <Carousel style={{ direction: "ltr" }}>
                          <CarouselPrevious />
                          <CarouselContent className="h-[400px]">
                            {failureImages.map((url, idx) => (
                              <CarouselItem key={idx}>
                                <img
                                  src={url}
                                  alt={`תמונת כשלון ${idx + 1}`}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselNext />
                        </Carousel>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Package Images */}
        {packageImages.length > 0 && (
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="text-lg font-medium">
                  תמונות חבילות ({packageImages.length})
                </span>
              </div>
              {/* Carousel trigger moved to thumbnails below */}
            </div>
            <div className="flex flex-wrap gap-2">
              {packageImages.map((url, idx) => (
                <div
                  key={idx}
                  className="w-24 h-24 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <img
                    src={url}
                    alt={`חבילת תמונה ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
              {/* Show All trigger */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="w-24 h-24 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-180" />
                    <span className="text-xs text-muted-foreground mt-1">
                      הצג הכל
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>תמונות חבילות</DialogTitle>
                  </DialogHeader>
                  <Carousel style={{ direction: "ltr" }}>
                    <CarouselPrevious />
                    <CarouselContent className="h-[400px]">
                      {packageImages.map((url, idx) => (
                        <CarouselItem
                          key={idx}
                          className="relative"
                          onMouseEnter={() => getExifData(url)}
                        >
                          <img
                            src={url}
                            alt={`חבילת תמונה ${idx + 1}`}
                            className="h-full w-full object-cover rounded-lg"
                          />
                          {exifData[url]?.loading && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded-md space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          )}
                          {exifData[url] && !exifData[url].loading && !exifData[url].error && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded-md space-y-1">
                              {exifData[url].dateTimeOriginal && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      exifData[
                                        url
                                      ].dateTimeOriginal.replace(
                                        /(\d{4}):(\d{2}):(\d{2})/,
                                        "$1-$2-$3",
                                      ),
                                    ).toLocaleString("he-IL", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </span>
                                </div>
                              )}
                              {exifData[url].gps?.latitude &&
                                exifData[url].gps?.longitude && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${exifData[url].gps.latitude},${exifData[url].gps.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      פתח במפות
                                    </a>
                                  </div>
                                )}
                            </div>
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselNext />
                  </Carousel>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
        {/* Certificate Images */}
        {certificateImages.length > 0 && (
          <div className="space-y-2 text-right mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                <span className="text-lg font-medium">
                  תמונות תעודות ({certificateImages.length})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {certificateImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt={`תעודת תמונה ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {img.number && (
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-tl-lg">
                      {img.number}
                    </div>
                  )}
                </div>
              ))}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="w-24 h-24 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ArrowRight className="h-6 w-6 text-muted-foreground rotate-180" />
                    <span className="text-xs text-muted-foreground mt-1">
                      הצג הכל
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>תמונות תעודות</DialogTitle>
                  </DialogHeader>
                  <Carousel style={{ direction: "ltr" }}>
                    <CarouselPrevious />
                    <CarouselContent className="h-[400px]">
                      {certificateImages.map((img, idx) => (
                        <CarouselItem
                          key={idx}
                          className="relative"
                          onMouseEnter={() => getExifData(img.url)}
                        >
                          <img
                            src={img.url}
                            alt={`תעודת תמונה ${idx + 1}`}
                            className="h-full w-full object-cover rounded-lg"
                          />
                          {img.number && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded-md">
                              תעודה: {img.number}
                            </div>
                          )}
                          {exifData[img.url]?.loading && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded-md space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          )}
                          {exifData[img.url] && !exifData[img.url].loading && !exifData[img.url].error && (
                            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded-md space-y-1">
                              {exifData[img.url].dateTimeOriginal && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      exifData[
                                        img.url
                                      ].dateTimeOriginal.replace(
                                        /(\d{4}):(\d{2}):(\d{2})/,
                                        "$1-$2-$3",
                                      ),
                                    ).toLocaleString("he-IL", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </span>
                                </div>
                              )}
                              {exifData[img.url].gps?.latitude &&
                                exifData[img.url].gps?.longitude && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${exifData[img.url].gps.latitude},${exifData[img.url].gps.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      פתח במפות
                                    </a>
                                  </div>
                                )}
                            </div>
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselNext />
                  </Carousel>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Clock className="h-5 w-5" />
              ציר זמן
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">משימה נוצרה</div>
                  <div className="text-sm text-muted-foreground">
                    {createdDate.date} בשעה {createdDate.time}
                  </div>
                </div>
              </div>

              {mission.updated_at !== mission.created_at && (
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">עדכון אחרון</div>
                    <div className="text-sm text-muted-foreground">
                      {updatedDate.date} בשעה {updatedDate.time}
                    </div>
                  </div>
                </div>
              )}

              {deliveredDate && (
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">משימה הושלמה</div>
                    <div className="text-sm text-muted-foreground">
                      {deliveredDate.date} בשעה {deliveredDate.time}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

