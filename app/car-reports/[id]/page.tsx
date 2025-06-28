'use client';

import { useEffect, useState } from 'react';
import { VehicleInspection } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { checkItems, vehicleInspectionLabels } from '@/lib/constants';

export default function CarReportDetailsPage() {
  const { id } = useParams();
  const [report, setReport] = useState<VehicleInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="container mx-auto p-4">טוען פרטי דוח רכב...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">שגיאה: {error}</div>;
  }

  if (!report) {
    return <div className="container mx-auto p-4">דוח רכב לא נמצא.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">פרטי דוח רכב</h1>
      <Card>
        <CardHeader>
          <CardTitle>דוח לרכב מספר: {report.vehicleNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>{vehicleInspectionLabels.driverName}:</strong> {report.driverName}</p>
          <p><strong>{vehicleInspectionLabels.registrationNumber}:</strong> {report.registrationNumber}</p>
          <p><strong>{vehicleInspectionLabels.inspectionDate}:</strong> {new Date(report.inspectionDate).toLocaleDateString('he-IL')}</p>
          {report.inspectionTime && <p><strong>{vehicleInspectionLabels.inspectionTime}:</strong> {report.inspectionTime}</p>}
          <p><strong>{vehicleInspectionLabels.odometerReading}:</strong> {report.odometerReading}</p>

          <h2 className="text-xl font-semibold mt-6 mb-2">בדיקות רכב</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checkItems.map((item) => (
              <p key={item.key}>
                <strong>{item.label}:</strong> {report[item.key as keyof VehicleInspection] === 'ok' ? vehicleInspectionLabels.ok : vehicleInspectionLabels.not_ok}
              </p>
            ))}
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-2">פרטים נוספים</h2>
          <p><strong>{vehicleInspectionLabels.paintAndBody}:</strong> {report.paintAndBody}</p>
          <p><strong>{vehicleInspectionLabels.spareKeys}:</strong> {report.spareKeys}</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">{vehicleInspectionLabels.vehicleDamageDiagram}</h3>
          <ul>
            {report.vehicleDamageDiagram.front && <li>חזית</li>}
            {report.vehicleDamageDiagram.back && <li>אחור</li>}
            {report.vehicleDamageDiagram.left && <li>צד שמאל</li>}
            {report.vehicleDamageDiagram.right && <li>צד ימין</li>}
            {!report.vehicleDamageDiagram.front && !report.vehicleDamageDiagram.back && !report.vehicleDamageDiagram.left && !report.vehicleDamageDiagram.right && <li>אין נזקים מצוירים</li>}
          </ul>

          {report.notes && <p className="mt-4"><strong>{vehicleInspectionLabels.notes}:</strong> {report.notes}</p>}
          {report.eventsObligatingReporting && <p><strong>{vehicleInspectionLabels.eventsObligatingReporting}:</strong> {report.eventsObligatingReporting}</p>}
          <p className="mt-4"><strong>{vehicleInspectionLabels.driverSignature}:</strong> {report.driverSignature}</p>
        </CardContent>
      </Card>
    </div>
  );
}
