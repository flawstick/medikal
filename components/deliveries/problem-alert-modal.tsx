"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Mission } from "@/lib/types";

interface ProblemAlertModalProps {
  isOpen: boolean;
  mission: Mission | null;
  onClose: () => void;
  onViewDetails: () => void;
}

export function ProblemAlertModal({
  isOpen,
  mission,
  onClose,
  onViewDetails,
}: ProblemAlertModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            התראת בעיה במשלוח
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            {mission && (
              <>
                משלוח #{mission.id} של{" "}
                {mission.metadata?.client_name || "לקוח"} עבר לסטטוס "בעיה"
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  סוג: {mission.type}
                  {mission.subtype && ` (${mission.subtype})`}
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel>סגור</AlertDialogCancel>
          <AlertDialogAction
            onClick={onViewDetails}
            className="bg-destructive hover:bg-destructive/90"
          >
            צפה בפרטים
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}