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
  vehicleNumber: string;
  carId?: number;
  registrationNumber: string;
  driverName: string;
  inspectionDate: string;
  inspectionTime?: string;
  odometerReading: string;

  engineOil: 'ok' | 'not_ok';
  coolantWater: 'ok' | 'not_ok';
  windshieldWasherFluid: 'ok' | 'not_ok';
  battery: 'ok' | 'not_ok';
  fiveLBackupFuses: 'ok' | 'not_ok';

  tireToolKit: 'ok' | 'not_ok';
  spareTire: 'ok' | 'not_ok';
  spareTireToolKit: 'ok' | 'not_ok';

  reflectiveVest50Percent: 'ok' | 'not_ok';
  reflectiveTriangle50Percent: 'ok' | 'not_ok';

  firstAidKit: 'ok' | 'not_ok';
  fireExtinguisher: 'ok' | 'not_ok';

  jack: 'ok' | 'not_ok';
  tireIron: 'ok' | 'not_ok';
  spareWheel: 'ok' | 'not_ok';
  spareWheelMountingKit: 'ok' | 'not_ok';

  safetyVestQty1: 'ok' | 'not_ok';
  safetyVestQty2: 'ok' | 'not_ok';
  safetyVestQty3: 'ok' | 'not_ok';
  safetyVestQty4: 'ok' | 'not_ok';
  safetyVestQty5: 'ok' | 'not_ok';

  towingHookQty1: 'ok' | 'not_ok';
  towingHookQty2: 'ok' | 'not_ok';

  jumperCablesQty2: 'ok' | 'not_ok';
  wheelChocksQty2: 'ok' | 'not_ok';

  cellphoneChargerQty1: 'ok' | 'not_ok';

  paintAndBody: string;
  spareKeys: string;

  vehicleDamageDiagram: {
    front: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
  };

  notes?: string;
  eventsObligatingReporting?: string;
  driverSignature: string;
  metadata?: Record<string, any>;
};