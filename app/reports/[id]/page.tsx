import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";

type Report = {
  id: string;
  type: "general" | "crash";
  form_completion_date: string;
  identifier_name: string;
  incident_date: string | null;
  incident_time: string;
  incident_description: string;
  vehicle_number: string;
  driver_at_time: string;
  employee_involved: boolean;
  identifier_signature: string;
  incident_photos?: string[];
  crash_data?: CrashData | null;
  metadata: {
    currentLocation: string;
    currentDate: string;
    currentTime: string;
  };
};

type CrashData = {
  thirdPartyLicensePlate: string;
  thirdPartyVehicleType: string;
  thirdPartyVehicleColor: string;
  accidentLocation: string;
  accidentDateTime: string;
  thirdPartyLiabilityInsurancePhoto: string;
  thirdPartyComprehensiveInsurancePhoto: string;
  thirdPartyDamagePhotos: string[];
  ourVehicleDamagePhotos: string[];
  accidentScenePhotos: string[];
  accidentMechanismPhotos: string[];
  thirdPartyDriverName: string;
  thirdPartyDriverPhone: string;
};

const R2_BASE_URL = "https://pub-935a9967c0664658862019699749d4f6.r2.dev";

async function getReport(id: string): Promise<Report | null> {
  const res = await fetch(`/api/reports/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch report");
  }
  return res.json();
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base">{value || "לא צוין"}</p>
    </div>
  );
}

function ImageGrid({
  title,
  imageKeys,
}: {
  title: string;
  imageKeys: string[] | undefined;
}) {
  if (!imageKeys || imageKeys.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {imageKeys.map((key) => (
          <a
            key={key}
            href={`${R2_BASE_URL}/${key}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={`${R2_BASE_URL}/${key}`}
              alt={title}
              width={200}
              height={200}
              className="rounded-lg object-cover aspect-square"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export default async function ReportDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);

  if (!report) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-right">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>פרטי דיווח חירום</CardTitle>
              <CardDescription>מזהה דיווח: {report.id}</CardDescription>
            </div>
            <Badge
              variant={report.type === "crash" ? "destructive" : "secondary"}
            >
              {report.type === "crash" ? "תאונה" : "כללי"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="שם המדווח" value={report.identifier_name} />
            <InfoField
              label="תאריך מילוי הטופס"
              value={format(new Date(report.form_completion_date), "PPP")}
            />
            <InfoField
              label="תאריך האירוע"
              value={
                report.incident_date
                  ? format(new Date(report.incident_date), "PPP")
                  : "לא צוין"
              }
            />
            <InfoField label="שעת האירוע" value={report.incident_time} />
            <InfoField label="מספר רכב" value={report.vehicle_number} />
            <InfoField label="נהג בזמן האירוע" value={report.driver_at_time} />
            <InfoField
              label="האם מעורב עובד חברה"
              value={report.employee_involved ? "כן" : "לא"}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">תיאור האירוע</h3>
            <p className="text-base whitespace-pre-wrap">
              {report.incident_description}
            </p>
          </div>

          <ImageGrid
            title="תמונות מהאירוע"
            imageKeys={report.incident_photos}
          />

          {report.type === "crash" && report.crash_data && (
            <>
              <Separator />
              <div className="space-y-6">
                <h2 className="text-xl font-bold">פרטי תאונה</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField
                    label="שם נהג צד ג'"
                    value={report.crash_data.thirdPartyDriverName}
                  />
                  <InfoField
                    label="טלפון נהג צד ג'"
                    value={report.crash_data.thirdPartyDriverPhone}
                  />
                  <InfoField
                    label="מספר רישוי צד ג'"
                    value={report.crash_data.thirdPartyLicensePlate}
                  />
                  <InfoField
                    label="סוג רכב צד ג'"
                    value={report.crash_data.thirdPartyVehicleType}
                  />
                  <InfoField
                    label="צבע רכב צד ג'"
                    value={report.crash_data.thirdPartyVehicleColor}
                  />
                  <InfoField
                    label="מיקום התאונה"
                    value={report.crash_data.accidentLocation}
                  />
                  <InfoField
                    label="תאריך ושעת התאונה"
                    value={format(
                      new Date(report.crash_data.accidentDateTime),
                      "Pp",
                    )}
                  />
                </div>

                <ImageGrid
                  title="תמונות נזק לרכב שלנו"
                  imageKeys={report.crash_data.ourVehicleDamagePhotos}
                />
                <ImageGrid
                  title="תמונות נזק לרכב צד ג'"
                  imageKeys={report.crash_data.thirdPartyDamagePhotos}
                />
                <ImageGrid
                  title="תמונות זירת התאונה"
                  imageKeys={report.crash_data.accidentScenePhotos}
                />
                <ImageGrid
                  title="תמונות מנגנון התאונה"
                  imageKeys={report.crash_data.accidentMechanismPhotos}
                />
                <ImageGrid
                  title="צילום ביטוח חובה צד ג'"
                  imageKeys={[
                    report.crash_data.thirdPartyLiabilityInsurancePhoto,
                  ]}
                />
                <ImageGrid
                  title="צילום ביטוח מקיף צד ג'"
                  imageKeys={[
                    report.crash_data.thirdPartyComprehensiveInsurancePhoto,
                  ]}
                />
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">מטא-נתונים</h3>
            <InfoField
              label="מיקום נוכחי"
              value={report.metadata.currentLocation}
            />
            <InfoField
              label="תאריך דיווח"
              value={format(new Date(report.metadata.currentDate), "PPP")}
            />
            <InfoField label="שעת דיווח" value={report.metadata.currentTime} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
