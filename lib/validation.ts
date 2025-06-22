// Form validation utilities and schemas

import type {
  CreateMissionRequest,
  CreateDriverRequest,
  CreateCarRequest,
} from "@/lib/types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Hebrew validation messages
const messages = {
  required: "שדה זה הוא חובה",
  email: "כתובת אימייל לא תקינה",
  phone: "מספר טלפון לא תקין",
  minLength: (min: number) => `נדרש לפחות ${min} תווים`,
  maxLength: (max: number) => `מקסימום ${max} תווים`,
  positiveNumber: "נדרש מספר חיובי",
  year: "שנה לא תקינה",
  plateNumber: "מספר רכב לא תקין",
};

// Validation helpers
export const validators = {
  required: (value: any): boolean => {
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return !isNaN(value);
    return value != null && value !== undefined;
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value: string): boolean => {
    // Israeli phone number format (with or without country code)
    const phoneRegex = /^(\+972|0)?([2-9]\d{7,8}|5[0-9]\d{7})$/;
    return phoneRegex.test(value.replace(/[\s-]/g, ""));
  },

  minLength:
    (min: number) =>
    (value: string): boolean => {
      return value.length >= min;
    },

  maxLength:
    (max: number) =>
    (value: string): boolean => {
      return value.length <= max;
    },

  positiveNumber: (value: number): boolean => {
    return !isNaN(value) && value > 0;
  },

  year: (value: string): boolean => {
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 1;
  },

  plateNumber: (value: string): boolean => {
    // Israeli license plate format (various formats)
    const plateRegex =
      /^[\u05D0-\u05EA\d]{2,3}[-\s]?[\d]{2,3}[-\s]?[\d]{2,3}$|^\d{2,3}[-\s]?\d{2,3}[-\s]?\d{2,3}$/;
    return plateRegex.test(value.trim());
  },
};

// Mission validation
export function validateMission(
  data: Partial<CreateMissionRequest>,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!validators.required(data.type)) {
    errors.push({ field: "type", message: messages.required });
  }

  if (!data.address) {
    errors.push({ field: "address", message: messages.required });
  } else {
    if (typeof data.address === "object") {
      if (!validators.required(data.address.address)) {
        errors.push({ field: "address.address", message: messages.required });
      }
      if (!validators.required(data.address.city)) {
        errors.push({ field: "address.city", message: messages.required });
      }
    } else if (typeof data.address === "string") {
      if (!validators.required(data.address)) {
        errors.push({ field: "address", message: messages.required });
      }
    }
  }

  // Optional field validations
  if (
    data.metadata?.phone_number &&
    !validators.phone(data.metadata.phone_number)
  ) {
    errors.push({ field: "metadata.phone_number", message: messages.phone });
  }

  if (
    data.metadata?.client_name &&
    !validators.minLength(2)(data.metadata.client_name)
  ) {
    errors.push({
      field: "metadata.client_name",
      message: messages.minLength(2),
    });
  }

  // Certificates validation
  if (data.certificates && Array.isArray(data.certificates)) {
    data.certificates.forEach((cert, index) => {
      if (
        cert.packages_count !== undefined &&
        !validators.positiveNumber(cert.packages_count)
      ) {
        errors.push({
          field: `certificates.${index}.packages_count`,
          message: messages.positiveNumber,
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Driver validation
export function validateDriver(
  data: Partial<CreateDriverRequest>,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!validators.required(data.name)) {
    errors.push({ field: "name", message: messages.required });
  } else if (!validators.minLength(2)(data.name)) {
    errors.push({ field: "name", message: messages.minLength(2) });
  }

  // Optional field validations
  if (data.email && !validators.email(data.email)) {
    errors.push({ field: "email", message: messages.email });
  }

  if (data.phone && !validators.phone(data.phone)) {
    errors.push({ field: "phone", message: messages.phone });
  }

  if (data.license_number && !validators.minLength(5)(data.license_number)) {
    errors.push({ field: "license_number", message: messages.minLength(5) });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Car validation
export function validateCar(data: Partial<CreateCarRequest>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  /* if (!validators.required(data.plate_number)) {
    errors.push({ field: "plate_number", message: messages.required });
  } else if (!validators.plateNumber(data.plate_number as string)) {
    errors.push({ field: "plate_number", message: messages.plateNumber });
  }

  // Optional field validations
  if (data.make && !validators.minLength(2)(data.make)) {
    errors.push({ field: "make", message: messages.minLength(2) });
  }

  if (data.model && !validators.minLength(1)(data.model)) {
    errors.push({ field: "model", message: messages.minLength(1) });
  }

  if (data.year && !validators.year(data.year.toString())) {
    errors.push({ field: "year", message: messages.year });
  } */

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Real-time field validation for forms
export function validateField(
  fieldName: string,
  value: any,
  validationType: "mission" | "driver" | "car",
  context?: any,
): ValidationError | null {
  switch (validationType) {
    case "mission":
      const missionResult = validateMission({ [fieldName]: value, ...context });
      return missionResult.errors.find((e) => e.field === fieldName) || null;

    case "driver":
      const driverResult = validateDriver({ [fieldName]: value, ...context });
      return driverResult.errors.find((e) => e.field === fieldName) || null;

    case "car":
      const carResult = validateCar({ [fieldName]: value, ...context });
      return carResult.errors.find((e) => e.field === fieldName) || null;

    default:
      return null;
  }
}

// Utility function to get error message for a specific field
export function getFieldError(
  errors: ValidationError[],
  fieldName: string,
): string | undefined {
  return errors.find((error) => error.field === fieldName)?.message;
}
