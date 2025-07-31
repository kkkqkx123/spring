import type { ApiError } from '../types';

// Error message mappings for common HTTP status codes
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'You are not authorized to perform this action. Please log in.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data. Please refresh and try again.',
  422: 'The data provided is invalid. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'An internal server error occurred. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.',
  504: 'Request timeout. Please check your connection and try again.',
};

// Specific error code mappings for business logic errors
const BUSINESS_ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'User not found. Please check the username or email.',
  INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  USERNAME_ALREADY_EXISTS:
    'This username is already taken. Please choose another.',
  EMPLOYEE_NOT_FOUND: 'Employee not found. They may have been deleted.',
  DEPARTMENT_NOT_FOUND: 'Department not found. It may have been deleted.',
  DEPARTMENT_HAS_EMPLOYEES: 'Cannot delete department that contains employees.',
  DEPARTMENT_HAS_SUBDEPARTMENTS:
    'Cannot delete department that contains subdepartments.',
  INVALID_DEPARTMENT_HIERARCHY:
    'Invalid department hierarchy. Cannot move department to its own subdepartment.',
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again later.',
  FILE_UPLOAD_FAILED:
    'File upload failed. Please check the file and try again.',
  FILE_TOO_LARGE: 'File is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE:
    'Invalid file type. Please choose a supported file format.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and correct any errors.',
  DUPLICATE_EMPLOYEE_NUMBER:
    'Employee number already exists. Please use a unique number.',
  INVALID_DATE_RANGE: 'Invalid date range. End date must be after start date.',
  PAYROLL_ALREADY_PROCESSED:
    'Payroll for this period has already been processed.',
  INSUFFICIENT_PERMISSIONS:
    'You do not have sufficient permissions for this action.',
};

// Network error messages
const NETWORK_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  CONNECTION_ERROR: 'Unable to connect to the server. Please try again later.',
};

export interface ProcessedError {
  message: string;
  title: string;
  type: 'error' | 'warning' | 'info';
  retryable: boolean;
  actionable: boolean;
  details?: string;
}

/**
 * Process API errors into user-friendly messages
 */
export const processApiError = (error: ApiError): ProcessedError => {
  // Handle business logic errors with specific codes
  if (error.code && BUSINESS_ERROR_MESSAGES[error.code]) {
    return {
      message: BUSINESS_ERROR_MESSAGES[error.code],
      title: 'Error',
      type: 'error',
      retryable: isRetryableError(error),
      actionable: isActionableError(error),
      details: error.details
        ? JSON.stringify(error.details, null, 2)
        : undefined,
    };
  }

  // Handle HTTP status codes
  if (error.status && ERROR_MESSAGES[error.status]) {
    return {
      message: ERROR_MESSAGES[error.status],
      title: getErrorTitle(error.status),
      type: getErrorType(error.status),
      retryable: isRetryableError(error),
      actionable: isActionableError(error),
      details:
        error.message !== ERROR_MESSAGES[error.status]
          ? error.message
          : undefined,
    };
  }

  // Handle network errors
  if (error.status === 0) {
    return {
      message: NETWORK_ERROR_MESSAGES.NETWORK_ERROR,
      title: 'Connection Error',
      type: 'error',
      retryable: true,
      actionable: true,
    };
  }

  if (error.status === -1) {
    return {
      message: error.message || 'An unexpected error occurred.',
      title: 'Error',
      type: 'error',
      retryable: false,
      actionable: false,
    };
  }

  // Fallback for unknown errors
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    title: 'Error',
    type: 'error',
    retryable: true,
    actionable: false,
    details: error.details ? JSON.stringify(error.details, null, 2) : undefined,
  };
};

/**
 * Get appropriate error title based on status code
 */
const getErrorTitle = (status: number): string => {
  if (status >= 400 && status < 500) {
    return 'Request Error';
  }
  if (status >= 500) {
    return 'Server Error';
  }
  return 'Error';
};

/**
 * Get error type for notification styling
 */
const getErrorType = (status: number): 'error' | 'warning' | 'info' => {
  if (status === 401 || status === 403) {
    return 'warning';
  }
  if (status === 404) {
    return 'info';
  }
  return 'error';
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error: ApiError): boolean => {
  // Network errors are retryable
  if (error.status === 0) return true;

  // Server errors are retryable
  if (error.status >= 500) return true;

  // Rate limiting is retryable
  if (error.status === 429) return true;

  // Timeout errors are retryable
  if (error.status === 408 || error.status === 504) return true;

  // Specific business errors that are retryable
  const retryableCodes = ['EMAIL_SEND_FAILED', 'FILE_UPLOAD_FAILED'];
  if (error.code && retryableCodes.includes(error.code)) return true;

  return false;
};

/**
 * Determine if an error requires user action
 */
const isActionableError = (error: ApiError): boolean => {
  // Authentication errors require user action
  if (error.status === 401) return true;

  // Validation errors require user action
  if (error.status === 400 || error.status === 422) return true;

  // Conflict errors may require user action
  if (error.status === 409) return true;

  // Specific business errors that require action
  const actionableCodes = [
    'INVALID_CREDENTIALS',
    'EMAIL_ALREADY_EXISTS',
    'USERNAME_ALREADY_EXISTS',
    'VALIDATION_ERROR',
    'DUPLICATE_EMPLOYEE_NUMBER',
    'INVALID_DATE_RANGE',
  ];
  if (error.code && actionableCodes.includes(error.code)) return true;

  return false;
};

/**
 * Extract validation errors from API response
 */
export const extractValidationErrors = (
  error: ApiError
): Record<string, string> => {
  if (error.status === 422 && error.details) {
    // Assuming validation errors are in the format { field: message }
    return error.details as Record<string, string>;
  }

  if (error.code === 'VALIDATION_ERROR' && error.details) {
    return error.details as Record<string, string>;
  }

  return {};
};

/**
 * Create a retry function with exponential backoff
 */
export const createRetryFunction = <T>(
  originalFunction: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  return async (retryCount: number = 0): Promise<T> => {
    try {
      return await originalFunction();
    } catch (error) {
      const apiError = error as ApiError;

      if (retryCount < maxRetries && isRetryableError(apiError)) {
        const delay = baseDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return createRetryFunction(
          originalFunction,
          maxRetries,
          baseDelay
        )(retryCount + 1);
      }

      throw error;
    }
  };
};

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);

    // Prevent the default browser behavior
    event.preventDefault();

    // You could show a global error notification here
    // notificationService.showError('An unexpected error occurred');
  });

  // Handle general JavaScript errors
  window.addEventListener('error', event => {
    console.error('Global error:', event.error);

    // You could report this to an error tracking service
    // errorReportingService.captureException(event.error);
  });
};

/**
 * Format error for logging/reporting
 */
export const formatErrorForLogging = (
  error: Error | ApiError,
  context?: Record<string, unknown>
) => {
  const timestamp = new Date().toISOString();
  const userAgent = navigator.userAgent;
  const url = window.location.href;

  return {
    timestamp,
    userAgent,
    url,
    error: {
      name: 'name' in error ? error.name : 'ApiError',
      message: error.message,
      stack: 'stack' in error ? error.stack : undefined,
      ...('status' in error && { status: error.status }),
      ...('code' in error && { code: error.code }),
      ...('details' in error && { details: error.details }),
    },
    context,
  };
};
