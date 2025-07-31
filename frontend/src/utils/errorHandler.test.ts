import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  processApiError,
  extractValidationErrors,
  createRetryFunction,
  setupGlobalErrorHandling,
  formatErrorForLogging,
} from './errorHandler';
import type { ApiError } from '../types';

describe('processApiError', () => {
  it('processes business logic errors with specific codes', () => {
    const error: ApiError = {
      status: 400,
      message: 'User not found',
      code: 'USER_NOT_FOUND',
    };

    const result = processApiError(error);

    expect(result).toEqual({
      message: 'User not found. Please check the username or email.',
      title: 'Error',
      type: 'error',
      retryable: false,
      actionable: true,
    });
  });

  it('processes HTTP status codes', () => {
    const error: ApiError = {
      status: 404,
      message: 'Not found',
    };

    const result = processApiError(error);

    expect(result).toEqual({
      message: 'The requested resource was not found.',
      title: 'Request Error',
      type: 'info',
      retryable: false,
      actionable: false,
      details: 'Not found',
    });
  });

  it('processes network errors', () => {
    const error: ApiError = {
      status: 0,
      message: 'Network Error',
    };

    const result = processApiError(error);

    expect(result).toEqual({
      message: 'Network error. Please check your internet connection.',
      title: 'Connection Error',
      type: 'error',
      retryable: true,
      actionable: true,
    });
  });

  it('processes server errors as retryable', () => {
    const error: ApiError = {
      status: 500,
      message: 'Internal server error',
    };

    const result = processApiError(error);

    expect(result.retryable).toBe(true);
    expect(result.type).toBe('error');
    expect(result.title).toBe('Server Error');
  });

  it('processes authentication errors as warnings', () => {
    const error: ApiError = {
      status: 401,
      message: 'Unauthorized',
    };

    const result = processApiError(error);

    expect(result.type).toBe('warning');
    expect(result.actionable).toBe(true);
  });

  it('handles unknown errors with fallback', () => {
    const error: ApiError = {
      status: 999,
      message: 'Unknown error',
    };

    const result = processApiError(error);

    expect(result).toEqual({
      message: 'Unknown error',
      title: 'Error',
      type: 'error',
      retryable: true,
      actionable: false,
    });
  });

  it('includes details when different from message', () => {
    const error: ApiError = {
      status: 400,
      message: 'Custom error message',
      details: { field: 'value' },
    };

    const result = processApiError(error);

    expect(result.details).toBe('Custom error message');
  });
});

describe('extractValidationErrors', () => {
  it('extracts validation errors from 422 response', () => {
    const error: ApiError = {
      status: 422,
      message: 'Validation failed',
      details: {
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      },
    };

    const result = extractValidationErrors(error);

    expect(result).toEqual({
      email: 'Email is required',
      password: 'Password must be at least 8 characters',
    });
  });

  it('extracts validation errors from VALIDATION_ERROR code', () => {
    const error: ApiError = {
      status: 400,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: {
        firstName: 'First name is required',
      },
    };

    const result = extractValidationErrors(error);

    expect(result).toEqual({
      firstName: 'First name is required',
    });
  });

  it('returns empty object for non-validation errors', () => {
    const error: ApiError = {
      status: 500,
      message: 'Server error',
    };

    const result = extractValidationErrors(error);

    expect(result).toEqual({});
  });
});

describe('createRetryFunction', () => {
  it('retries failed operations with exponential backoff', async () => {
    let attempts = 0;
    const mockFunction = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw { status: 500, message: 'Server error' };
      }
      return Promise.resolve('success');
    });

    const retryFunction = createRetryFunction(mockFunction, 3, 100);
    const result = await retryFunction();

    expect(result).toBe('success');
    expect(mockFunction).toHaveBeenCalledTimes(3);
  });

  it('stops retrying after max attempts', async () => {
    const mockFunction = vi.fn().mockRejectedValue({
      status: 500,
      message: 'Server error',
    });

    const retryFunction = createRetryFunction(mockFunction, 2, 100);

    await expect(retryFunction()).rejects.toEqual({
      status: 500,
      message: 'Server error',
    });

    expect(mockFunction).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('does not retry non-retryable errors', async () => {
    const mockFunction = vi.fn().mockRejectedValue({
      status: 400,
      message: 'Bad request',
    });

    const retryFunction = createRetryFunction(mockFunction, 3, 100);

    await expect(retryFunction()).rejects.toEqual({
      status: 400,
      message: 'Bad request',
    });

    expect(mockFunction).toHaveBeenCalledTimes(1); // No retries
  });

  it('implements exponential backoff', async () => {
    const delays: number[] = [];
    const originalSetTimeout = global.setTimeout;
    
    global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
      delays.push(delay);
      return originalSetTimeout(callback, 0); // Execute immediately for test
    });

    const mockFunction = vi.fn()
      .mockRejectedValueOnce({ status: 500, message: 'Error 1' })
      .mockRejectedValueOnce({ status: 500, message: 'Error 2' })
      .mockResolvedValueOnce('success');

    const retryFunction = createRetryFunction(mockFunction, 3, 1000);
    await retryFunction();

    expect(delays).toEqual([1000, 2000]); // 1000 * 2^0, 1000 * 2^1

    global.setTimeout = originalSetTimeout;
  });
});

describe('setupGlobalErrorHandling', () => {
  let originalAddEventListener: typeof window.addEventListener;
  let mockAddEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalAddEventListener = window.addEventListener;
    mockAddEventListener = vi.fn();
    window.addEventListener = mockAddEventListener;
    console.error = vi.fn();
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
  });

  it('sets up unhandled rejection handler', () => {
    setupGlobalErrorHandling();

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    );
  });

  it('sets up global error handler', () => {
    setupGlobalErrorHandling();

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );
  });

  it('handles unhandled promise rejections', () => {
    setupGlobalErrorHandling();

    const rejectionHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'unhandledrejection'
    )?.[1];

    const mockEvent = {
      reason: new Error('Unhandled rejection'),
      preventDefault: vi.fn(),
    };

    rejectionHandler(mockEvent);

    expect(console.error).toHaveBeenCalledWith(
      'Unhandled promise rejection:',
      mockEvent.reason
    );
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('handles global errors', () => {
    setupGlobalErrorHandling();

    const errorHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];

    const mockEvent = {
      error: new Error('Global error'),
    };

    errorHandler(mockEvent);

    expect(console.error).toHaveBeenCalledWith('Global error:', mockEvent.error);
  });
});

describe('formatErrorForLogging', () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/test' },
      writable: true,
    });

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Test User Agent',
      writable: true,
    });
  });

  it('formats regular Error for logging', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    const result = formatErrorForLogging(error, { userId: 123 });

    expect(result).toEqual({
      timestamp: expect.any(String),
      userAgent: 'Test User Agent',
      url: 'https://example.com/test',
      error: {
        name: 'Error',
        message: 'Test error',
        stack: 'Error stack trace',
      },
      context: { userId: 123 },
    });
  });

  it('formats ApiError for logging', () => {
    const error: ApiError = {
      status: 404,
      message: 'Not found',
      code: 'RESOURCE_NOT_FOUND',
      details: { resourceId: 'abc123' },
    };

    const result = formatErrorForLogging(error);

    expect(result).toEqual({
      timestamp: expect.any(String),
      userAgent: 'Test User Agent',
      url: 'https://example.com/test',
      error: {
        name: 'Error',
        message: 'Not found',
        stack: undefined,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        details: { resourceId: 'abc123' },
      },
      context: undefined,
    });
  });

  it('includes context when provided', () => {
    const error = new Error('Test error');
    const context = {
      userId: 123,
      action: 'delete_employee',
      employeeId: 456,
    };

    const result = formatErrorForLogging(error, context);

    expect(result.context).toEqual(context);
  });

  it('generates valid timestamp', () => {
    const error = new Error('Test error');
    const result = formatErrorForLogging(error);

    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
  });
});