'use client';

import { useEffect, useState } from 'react';
import { VehicleInspection } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkItems, vehicleInspectionLabels } from '@/lib/constants';

export default function CarReportDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<VehicleInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      if (!id) return;

      try {
        const response = await fetch(`/api/car-reports/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch car report');
        }

        const data = await response.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  const handleEdit = () => {
    router.push(`/car-reports/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק דוח זה?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/car-reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete report');
      }

      toast({
        title: 'הדוח נמחק',
        description: 'דוח הרכב נמחק בהצלחה',
      });

      router.push('/car-reports');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-10 -mx-8 mb-6 bg-background/95 backdrop-blur-md border-b">
          <div className="px-8 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeletons */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">שגיאה: {error}</div>;
  }

  if (!report) {
    return <div className="container mx-auto p-4">דוח רכב לא נמצא.</div>;
  }

  return (
    <div className="space-y-6 pt-6" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-8 mb-6 bg-background/95 backdrop-blur-md border-b">
        <div className="px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/car-reports')}
                className="rounded-full hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                חזרה לדוחות רכב
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Edit className="ml-2 h-4 w-4" />
                  עריכה
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  {deleting ? 'מוחק...' : 'מחיקה'}
                </Button>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-extrabold tracking-tight">
                דוח רכב מספר {report.metadata?.vehicleNumber || 'לא זמין'}
              </h1>
              <p className="text-muted-foreground mt-1">
                נהג: {report.metadata?.driverName || 'לא זמין'} • {
                  report.metadata?.inspectionDate 
                    ? new Date(report.metadata.inspectionDate).toLocaleDateString('he-IL')
                    : 'לא זמין'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">פרטי הבדיקה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-right">
            <div className="grid grid-cols-2 gap-4">
              <p><strong>{vehicleInspectionLabels.vehicleNumber}:</strong> {report.metadata?.vehicleNumber || 'לא זמין'}</p>
              <p><strong>{vehicleInspectionLabels.driverName}:</strong> {report.metadata?.driverName || 'לא זמין'}</p>
              <p><strong>{vehicleInspectionLabels.registrationNumber}:</strong> {report.metadata?.registrationNumber || 'לא זמין'}</p>
              <p><strong>{vehicleInspectionLabels.inspectionDate}:</strong> {
                report.metadata?.inspectionDate 
                  ? new Date(report.metadata.inspectionDate).toLocaleDateString('he-IL')
                  : 'לא זמין'
              }</p>
              {report.metadata?.inspectionTime && (
                <p><strong>{vehicleInspectionLabels.inspectionTime}:</strong> {report.metadata.inspectionTime}</p>
              )}
              <p><strong>{vehicleInspectionLabels.odometerReading}:</strong> {report.metadata?.odometerReading || 'לא זמין'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Items Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">בדיקות רכב</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checkItems.map((item) => {
                const value = report.metadata?.[item.key as keyof typeof report.metadata];
                const status = value ? vehicleInspectionLabels.ok : vehicleInspectionLabels.not_ok;
                return (
                  <div key={item.key} className="flex justify-between items-center p-3 border rounded-lg">
                    <span className={`font-medium text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                      {status}
                    </span>
                    <span className="text-right">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Diagram Card */}
        {report.metadata?.vehicleDrawing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-right">דיאגרמת הרכב</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative inline-block">
                {/* Base vehicle diagram */}
                <img 
                  src="/vehicle-diagram.png" 
                  alt="דיאגרמת רכב בסיסית" 
                  className="max-w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
                {/* Drawing overlay as image */}
                <img 
                  src={report.metadata.vehicleDrawing.startsWith('data:') 
                    ? report.metadata.vehicleDrawing 
                    : `data:image/png;base64,${report.metadata.vehicleDrawing}`
                  }
                  alt="ציור על הרכב" 
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  style={{ opacity: 0.8 }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Details Card */}
        {(report.metadata?.paintAndBody || report.metadata?.spareKeys || report.metadata?.notes || report.metadata?.eventsObligatingReporting) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-right">פרטים נוספים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-right">
              {report.metadata?.paintAndBody && (
                <p><strong>{vehicleInspectionLabels.paintAndBody}:</strong> {report.metadata.paintAndBody}</p>
              )}
              {report.metadata?.spareKeys && (
                <p><strong>{vehicleInspectionLabels.spareKeys}:</strong> {report.metadata.spareKeys}</p>
              )}
              {report.metadata?.notes && (
                <p><strong>{vehicleInspectionLabels.notes}:</strong> {report.metadata.notes}</p>
              )}
              {report.metadata?.eventsObligatingReporting && (
                <p><strong>{vehicleInspectionLabels.eventsObligatingReporting}:</strong> {report.metadata.eventsObligatingReporting}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Signature Card */}
        {report.metadata?.signature && (
          <Card>
            <CardHeader>
              <CardTitle className="text-right">חתימת הנהג</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <img 
                src={report.metadata.signature} 
                alt="חתימת הנהג" 
                className="max-w-full h-auto border rounded mx-auto"
                style={{ maxHeight: '200px' }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
