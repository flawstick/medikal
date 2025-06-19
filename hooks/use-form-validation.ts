"use client"

import { useState, useCallback } from 'react'
import { validateField, getFieldError, type ValidationError } from '@/lib/validation'

interface UseFormValidationOptions {
  validationType: 'mission' | 'driver' | 'car'
  validateOnBlur?: boolean
  validateOnChange?: boolean
}

interface UseFormValidationReturn {
  errors: Record<string, string>
  isValid: boolean
  validateFieldAsync: (fieldName: string, value: any, context?: any) => Promise<void>
  validateForm: (data: any) => boolean
  clearErrors: () => void
  clearFieldError: (fieldName: string) => void
  setFieldError: (fieldName: string, error: string) => void
}

export function useFormValidation(options: UseFormValidationOptions): UseFormValidationReturn {
  const { validationType, validateOnBlur = true, validateOnChange = false } = options
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateFieldAsync = useCallback(async (
    fieldName: string, 
    value: any, 
    context?: any
  ) => {
    try {
      const error = validateField(fieldName, value, validationType, context)
      
      setErrors(prev => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[fieldName] = error.message
        } else {
          delete newErrors[fieldName]
        }
        return newErrors
      })
    } catch (err) {
      console.error('Validation error:', err)
    }
  }, [validationType])

  const validateForm = useCallback((data: any): boolean => {
    let validationResult
    
    switch (validationType) {
      case 'mission':
        const { validateMission } = require('@/lib/validation')
        validationResult = validateMission(data)
        break
      case 'driver':
        const { validateDriver } = require('@/lib/validation')
        validationResult = validateDriver(data)
        break
      case 'car':
        const { validateCar } = require('@/lib/validation')
        validationResult = validateCar(data)
        break
      default:
        return false
    }

    if (!validationResult.isValid) {
      const errorMap: Record<string, string> = {}
      validationResult.errors.forEach((error: ValidationError) => {
        errorMap[error.field] = error.message
      })
      setErrors(errorMap)
      return false
    }

    setErrors({})
    return true
  }, [validationType])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    errors,
    isValid,
    validateFieldAsync,
    validateForm,
    clearErrors,
    clearFieldError,
    setFieldError
  }
}

// Helper hook for form inputs with automatic validation
export function useValidatedInput(
  fieldName: string,
  value: any,
  formValidation: UseFormValidationReturn,
  options: {
    validateOnBlur?: boolean
    validateOnChange?: boolean
    context?: any
  } = {}
) {
  const { validateOnBlur = true, validateOnChange = false, context } = options

  const handleBlur = useCallback(() => {
    if (validateOnBlur) {
      formValidation.validateFieldAsync(fieldName, value, context)
    }
  }, [fieldName, value, context, validateOnBlur, formValidation])

  const handleChange = useCallback((newValue: any) => {
    if (validateOnChange) {
      formValidation.validateFieldAsync(fieldName, newValue, context)
    }
    // Clear error when user starts typing after an error
    if (formValidation.errors[fieldName]) {
      formValidation.clearFieldError(fieldName)
    }
  }, [fieldName, validateOnChange, context, formValidation])

  return {
    error: formValidation.errors[fieldName],
    hasError: !!formValidation.errors[fieldName],
    onBlur: handleBlur,
    onChange: handleChange
  }
}