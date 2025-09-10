'use client';

import { useEffect, useState } from 'react';
import { VehicleInspection } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkItems, vehicleInspectionLabels } from '@/lib/constants';

export default function EditCarReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<VehicleInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

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
        setFormData(data.metadata || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/car-reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report');
      }

      toast({
        title: 'הדוח עודכן',
        description: 'דוח הרכב עודכן בהצלחה',
      });

      router.push(`/car-reports/${id}`);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
          <Skeleton className="h-8 w-64 mt-4" />
        </div>
        
        {/* Form Skeletons */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
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
                onClick={() => router.push(`/car-reports/${id}`)}
                className="rounded-full hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                חזרה לדוח
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="ml-2 h-4 w-4" />
                {saving ? 'שומר...' : 'שמירה'}
              </Button>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-extrabold tracking-tight">
                עריכת דוח רכב מספר {formData?.vehicleNumber || 'לא זמין'}
              </h1>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleNumber" className="text-right block mb-1">
                  {vehicleInspectionLabels.vehicleNumber}
                </Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber || ''}
                  onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="driverName" className="text-right block mb-1">
                  {vehicleInspectionLabels.driverName}
                </Label>
                <Input
                  id="driverName"
                  value={formData.driverName || ''}
                  onChange={(e) => handleInputChange('driverName', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber" className="text-right block mb-1">
                  {vehicleInspectionLabels.registrationNumber}
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber || ''}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="odometerReading" className="text-right block mb-1">
                  {vehicleInspectionLabels.odometerReading}
                </Label>
                <Input
                  id="odometerReading"
                  value={formData.odometerReading || ''}
                  onChange={(e) => handleInputChange('odometerReading', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="inspectionDate" className="text-right block mb-1">
                  {vehicleInspectionLabels.inspectionDate}
                </Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={formData.inspectionDate || ''}
                  onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="inspectionTime" className="text-right block mb-1">
                  {vehicleInspectionLabels.inspectionTime}
                </Label>
                <Input
                  id="inspectionTime"
                  type="time"
                  value={formData.inspectionTime || ''}
                  onChange={(e) => handleInputChange('inspectionTime', e.target.value)}
                  className="text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Items Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">בדיקות רכב</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkItems.map((item) => (
                <div key={item.key} className="flex justify-between items-center p-3 border rounded-lg">
                  <Switch
                    checked={!!formData[item.key]}
                    onCheckedChange={(checked) => handleInputChange(item.key, checked)}
                  />
                  <span className="text-right">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">פרטים נוספים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paintAndBody" className="text-right block mb-1">
                {vehicleInspectionLabels.paintAndBody}
              </Label>
              <Textarea
                id="paintAndBody"
                value={formData.paintAndBody || ''}
                onChange={(e) => handleInputChange('paintAndBody', e.target.value)}
                className="text-right"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="spareKeys" className="text-right block mb-1">
                {vehicleInspectionLabels.spareKeys}
              </Label>
              <Textarea
                id="spareKeys"
                value={formData.spareKeys || ''}
                onChange={(e) => handleInputChange('spareKeys', e.target.value)}
                className="text-right"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-right block mb-1">
                {vehicleInspectionLabels.notes}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="text-right"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="eventsObligatingReporting" className="text-right block mb-1">
                {vehicleInspectionLabels.eventsObligatingReporting}
              </Label>
              <Textarea
                id="eventsObligatingReporting"
                value={formData.eventsObligatingReporting || ''}
                onChange={(e) => handleInputChange('eventsObligatingReporting', e.target.value)}
                className="text-right"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Note about signature and drawing */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center text-sm">
              הערה: חתימת הנהג ודיאגרמת הרכב לא ניתנות לעריכה
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}