"use client";

import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortControlsProps {
  sortBy: string;
  sortOrder: string;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: string) => void;
}

export function SortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: SortControlsProps) {
  return (
    <div className="flex gap-2 order-2">
      {/* Sort By */}
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-32 h-9">
          <ArrowUpDown className="h-4 w-4 ml-2" />
          <SelectValue placeholder="מיון לפי" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="created_at"
            className="hover:bg-transparent hover:text-foreground"
          >
            תאריך יצירה
          </SelectItem>
          <SelectItem
            value="updated_at"
            className="hover:bg-transparent hover:text-foreground"
          >
            עדכון אחרון
          </SelectItem>
          <SelectItem
            value="time_delivered"
            className="hover:bg-transparent hover:text-foreground"
          >
            זמן משלוח
          </SelectItem>
          <SelectItem
            value="id"
            className="hover:bg-transparent hover:text-foreground"
          >
            מספר משלוח
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Order */}
      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="w-28 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="desc"
            className="hover:bg-transparent hover:text-foreground"
          >
            חדש לישן
          </SelectItem>
          <SelectItem
            value="asc"
            className="hover:bg-transparent hover:text-foreground"
          >
            ישן לחדש
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}