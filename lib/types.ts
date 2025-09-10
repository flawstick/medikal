// Shared type definitions for the Medikal application

export interface Address {
  address: string
  city: string
  zip_code: string
}

export interface Certificate {
  certificate_number: string
  packages_count: number
  notes?: string
  type?: string
}

export interface MissionMetadata {
  client_name?: string
  phone_number?: string
}

export type MissionStatus = "unassigned" | "waiting" | "in_progress" | "completed" | "problem"

export interface Mission {
  id: number
  type: string
  subtype: string | null
  address: Address
  driver: string | null
  car_number: string | null
  driver_id: number | null
  car_id: number | null
  status: MissionStatus
  date_expected: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  certificates: Certificate[] | null
  metadata?: MissionMetadata
}

// API Request/Response Types
export interface CreateMissionRequest {
  type: string
  subtype?: string
  address: Address | string // Can be string for backward compatibility
  driver?: string
  car_number?: string
  driver_id?: number
  car_id?: number
  date_expected?: string
  certificates?: Partial<Certificate>[]
  metadata?: MissionMetadata
}

export interface CreateDriverRequest {
  name: string
  phone?: string
  email?: string
  license_number?: string
  metadata?: Record<string, any>
}

export interface CreateCarRequest {
  plate_number: string
  make?: string
  model?: string
  year?: number
  color?: string
  metadata?: Record<string, any>
}

export interface Driver {
  id: number
  name: string
  phone?: string
  email?: string
  license_number?: string
  is_active: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Car {
  id: number
  plate_number: string
  make?: string
  model?: string
  year?: number
  color?: string
  is_active: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// Google Maps Types
export interface GoogleMapsAddressComponent {
  types: string[]
  long_name: string
  short_name: string
}

export interface GoogleMapsPlace {
  formatted_address?: string
  name?: string
  address_components?: GoogleMapsAddressComponent[]
}

// Chart/Analytics Types
export interface ChartDataPoint {
  name: string
  value: number
  fill?: string
}

export interface StatusCount {
  status: MissionStatus
  count: number
}

// API Response Types
export interface APIResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export type VehicleInspection = {
  id: number;
  driver_id: number;
  car_id?: number;
  metadata: {
    vehicleNumber?: string;
    registrationNumber?: string;
    driverName?: string;
    inspectionDate?: string;
    inspectionTime?: string;
    odometerReading?: string;
    signature?: string;
    paintAndBody?: string;
    spareKeys?: string;
    notes?: string;
    eventsObligatingReporting?: string;
    vehicleDrawing?: string;
    // Inspection items (can be any combination from checkItems)
    engineOil?: boolean;
    coolantWater?: boolean;
    windshieldWasherFluid?: boolean;
    ureaOver50?: boolean;
    dieselOver50?: boolean;
    lightsAndMirrors?: boolean;
    spareWheel?: boolean;
    wheelChangeKit?: boolean;
    compulsoryInsuranceValid?: boolean;
    propertyInsuranceValid?: boolean;
    vehicleTest?: boolean;
    doorOpening?: boolean;
    trolley?: boolean;
    cameras?: boolean;
    drivingSystems?: boolean;
    cellPhone?: boolean;
    externalInternalCleaning?: boolean;
    winchCap?: boolean;
    winchBattery?: boolean;
    winchRemote?: boolean;
    winchChargingCable?: boolean;
    colorKit?: boolean;
    phoneCharger?: boolean;
    fridge?: boolean;
    returnLight?: boolean;
  };
  created_at: string;
  updated_at: string;
};