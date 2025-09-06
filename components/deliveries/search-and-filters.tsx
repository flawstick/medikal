"use client";

import { Search, Filter, User } from "lucide-react";
import { Car as CarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Car, Driver } from "@/lib/types";

interface SearchAndFiltersProps {
  searchQuery: string;
  certificateQuery: string;
  statusFilter: string;
  carFilter: string;
  driverFilter: string;
  cars: Car[];
  drivers: Driver[];
  onSearchChange: (value: string) => void;
  onCertificateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCarChange: (value: string) => void;
  onDriverChange: (value: string) => void;
  onClearFilters: () => void;
}

export function SearchAndFilters({
  searchQuery,
  certificateQuery,
  statusFilter,
  carFilter,
  driverFilter,
  cars,
  drivers,
  onSearchChange,
  onCertificateChange,
  onStatusChange,
  onCarChange,
  onDriverChange,
  onClearFilters,
}: SearchAndFiltersProps) {
  return (
    <div className="flex gap-2 order-1 flex-wrap items-center">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חפש משלוחים..."
          className="pr-10 text-right h-9 w-48"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Certificate Search */}
      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חפש לפי מספר תעודה..."
          className="pr-10 text-right h-9 w-48"
          value={certificateQuery}
          onChange={(e) => onCertificateChange(e.target.value)}
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-32 h-9">
          <Filter className="h-4 w-4 ml-2" />
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="all"
            className="hover:bg-transparent hover:text-foreground"
          >
            כל הסטטוסים
          </SelectItem>
          <SelectItem
            value="unassigned"
            className="hover:bg-transparent hover:text-foreground"
          >
            ללא הקצאה
          </SelectItem>
          <SelectItem
            value="waiting"
            className="hover:bg-transparent hover:text-foreground"
          >
            ממתין
          </SelectItem>
          <SelectItem
            value="in_progress"
            className="hover:bg-transparent hover:text-foreground"
          >
            בדרך
          </SelectItem>
          <SelectItem
            value="completed"
            className="hover:bg-transparent hover:text-foreground"
          >
            הושלם
          </SelectItem>
          <SelectItem
            value="problem"
            className="hover:bg-transparent hover:text-foreground"
          >
            בעיה
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Car Filter */}
      <Select value={carFilter} onValueChange={onCarChange}>
        <SelectTrigger className="w-32 h-9">
          <CarIcon className="h-4 w-4 ml-2" />
          <SelectValue placeholder="רכב" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="all"
            className="hover:bg-transparent hover:text-foreground"
          >
            כל הרכבים
          </SelectItem>
          <SelectItem
            value="unassigned"
            className="hover:bg-transparent hover:text-foreground"
          >
            ללא רכב
          </SelectItem>
          {cars.map((car) => (
            <SelectItem
              key={car.id}
              value={car.id.toString()}
              className="hover:bg-transparent hover:text-foreground"
            >
              {car.plate_number}
              {car.make && car.model && ` - ${car.make} ${car.model}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Driver Filter */}
      <Select value={driverFilter} onValueChange={onDriverChange}>
        <SelectTrigger className="w-32 h-9">
          <User className="h-4 w-4 ml-2" />
          <SelectValue placeholder="נהג" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="all"
            className="hover:bg-transparent hover:text-foreground"
          >
            כל הנהגים
          </SelectItem>
          <SelectItem
            value="unassigned"
            className="hover:bg-transparent hover:text-foreground"
          >
            ללא נהג
          </SelectItem>
          {drivers.map((driver) => (
            <SelectItem
              key={driver.id}
              value={driver.id.toString()}
              className="hover:bg-transparent hover:text-foreground"
            >
              {driver.name}
              {driver.phone && ` (${driver.phone})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters button */}
      <Button variant="outline" size="sm" className="h-9" onClick={onClearFilters}>
        נקה מסננים
      </Button>
    </div>
  );
}