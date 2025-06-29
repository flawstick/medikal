import { ReportsTable } from "@/components/reports-table";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>טוען...</div>}>
      <Card>
        <CardHeader className="text-right">
          <CardTitle>דיווחי חירום</CardTitle>
          <CardDescription>
            רשימה של כל דיווחי החירום.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsTable />
        </CardContent>
      </Card>
    </Suspense>
  );
}
