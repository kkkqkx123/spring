/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  useLoadingState,
  useMultipleLoadingStates,
  useFormSubmission,
  useAsyncOperation,
} from './useLoadingState';

// Mock the toast hook
vi.mock('../components/ui/ToastNotifications', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('handles successful execution', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

    let promise: Promise<any>;
    act(() => {
      promise = result.current.execute(mockAsyncFunction);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe('success data');
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
  });

  it('handles failed execution', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockError = new Error('Test error');
    const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

    let promise: Promise<any>;
    act(() => {
      promise = result.current.execute(mockAsyncFunction);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      try {
        await promise;
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBe(null);
  });

  it('handles retries on failure', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useLoadingState({ retries: 2, retryDelay: 100 })
    );

    const mockAsyncFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success after retries');

    let promise: Promise<any>;
    act(() => {
      promise = result.current.execute(mockAsyncFunction);
    });

    // Fast-forward through retry delays
    await act(async () => {
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(400);
      await promise;
    });

    expect(mockAsyncFunction).toHaveBeenCalledTimes(3);
    expect(result.current.data).toBe('success after retries');
    expect(result.current.error).toBe(null);

    vi.useRealTimers();
  });

  it('calls success callback on successful execution', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLoadingState({ onSuccess }));
    const mockAsyncFunction = vi.fn().mockResolvedValue('success data');

    await act(async () => {
      await result.current.execute(mockAsyncFunction);
    });

    expect(onSuccess).toHaveBeenCalledWith('success data');
  });

  it('calls error callback on failed execution', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useLoadingState({ onError }));
    const mockError = new Error('Test error');
    const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

    await act(async () => {
      try {
        await result.current.execute(mockAsyncFunction);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useLoadingState());

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('cancels ongoing operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockAsyncFunction = vi.fn().mockImplementation(
      signal =>
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve('data'), 1000);
          signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
          });
        })
    );

    let promise: Promise<any>;
    act(() => {
      promise = result.current.execute(mockAsyncFunction);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isLoading).toBe(false);

    // We expect the promise to be rejected, and this handles the rejection gracefully.
    await expect(promise!).rejects.toThrow('Aborted');
  });
});

describe('useMultipleLoadingStates', () => {
  it('manages multiple loading states independently', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setLoading('operation2', false);
    });

    expect(result.current.getState('operation1').isLoading).toBe(true);
    expect(result.current.getState('operation2').isLoading).toBe(false);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('sets error for specific operation', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());
    const error = new Error('Test error');

    act(() => {
      result.current.setError('operation1', error);
    });

    expect(result.current.getState('operation1').error).toBe(error);
    expect(result.current.getState('operation1').isLoading).toBe(false);
    expect(result.current.hasAnyError()).toBe(true);
  });

  it('sets data for specific operation', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setData('operation1', 'test data');
    });

    expect(result.current.getState('operation1').data).toBe('test data');
    expect(result.current.getState('operation1').isLoading).toBe(false);
    expect(result.current.getState('operation1').error).toBe(null);
  });

  it('resets specific operation', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setData('operation2', 'data');
    });

    expect(result.current.states.operation1).toBeDefined();
    expect(result.current.states.operation2).toBeDefined();

    act(() => {
      result.current.reset('operation1');
    });

    expect(result.current.states.operation1).toBeUndefined();
    expect(result.current.states.operation2).toBeDefined();
  });

  it('resets all operations', () => {
    const { result } = renderHook(() => useMultipleLoadingStates());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setData('operation2', 'data');
    });

    expect(Object.keys(result.current.states)).toHaveLength(2);

    act(() => {
      result.current.reset();
    });

    expect(Object.keys(result.current.states)).toHaveLength(0);
  });
});

describe('useFormSubmission', () => {
  it('handles form submission with validation', async () => {
    const { result } = renderHook(() => useFormSubmission());
    const mockSubmitFunction = vi.fn().mockResolvedValue('form data');
    const mockValidationFunction = vi.fn().mockReturnValue(null);

    await act(async () => {
      await result.current.submit(mockSubmitFunction, mockValidationFunction);
    });

    expect(mockValidationFunction).toHaveBeenCalled();
    expect(mockSubmitFunction).toHaveBeenCalled();
    expect(result.current.data).toBe('form data');
    expect(Object.keys(result.current.validationErrors)).toHaveLength(0);
  });

  it('prevents submission when validation fails', async () => {
    const { result } = renderHook(() => useFormSubmission());
    const mockSubmitFunction = vi.fn();
    const mockValidationFunction = vi.fn().mockReturnValue({
      email: 'Email is required',
      password: 'Password is required',
    });

    await act(async () => {
      await result.current.submit(mockSubmitFunction, mockValidationFunction);
    });

    expect(mockValidationFunction).toHaveBeenCalled();
    expect(mockSubmitFunction).not.toHaveBeenCalled();
    expect(result.current.validationErrors).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it('clears validation errors', async () => {
    const { result } = renderHook(() => useFormSubmission());
    const mockSubmitFunction = vi.fn();
    const mockValidationFunction = vi.fn().mockReturnValue({
      email: 'Email is required',
    });

    // First trigger validation errors
    await act(async () => {
      await result.current.submit(mockSubmitFunction, mockValidationFunction);
    });

    expect(Object.keys(result.current.validationErrors)).toHaveLength(1);

    // Then clear them
    act(() => {
      result.current.clearValidationErrors();
    });

    expect(Object.keys(result.current.validationErrors)).toHaveLength(0);
  });
});

describe('useAsyncOperation', () => {
  it('starts and tracks async operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockAsyncFunction = vi.fn().mockImplementation(
      updateProgress =>
        new Promise(resolve => {
          updateProgress(50);
          setTimeout(() => {
            updateProgress(100);
            resolve('operation result');
          }, 100);
        })
    );

    act(() => {
      result.current.startOperation('op1', 'Test Operation', mockAsyncFunction);
    });

    expect(result.current.operations).toHaveLength(1);
    expect(result.current.operations[0].status).toBe('running');
    expect(result.current.operations[0].title).toBe('Test Operation');

    await waitFor(() => {
      expect(result.current.operations[0].status).toBe('completed');
    });

    expect(result.current.operations[0].result).toBe('operation result');
  });

  it('handles operation failure', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const mockError = new Error('Operation failed');

    const mockAsyncFunction = vi.fn().mockRejectedValue(mockError);

    act(() => {
      result.current.startOperation(
        'op1',
        'Failed Operation',
        mockAsyncFunction
      );
    });

    await waitFor(() => {
      expect(result.current.operations[0].status).toBe('error');
    });

    expect(result.current.operations[0].error).toBe(mockError);
  });

  it('cancels operation', () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockAsyncFunction = vi.fn().mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    act(() => {
      result.current.startOperation('op1', 'Test Operation', mockAsyncFunction);
    });

    expect(result.current.operations[0].status).toBe('running');

    act(() => {
      result.current.cancelOperation('op1');
    });

    expect(result.current.operations[0].status).toBe('cancelled');
  });

  it('removes operation', () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockAsyncFunction = vi.fn().mockResolvedValue('result');

    act(() => {
      result.current.startOperation('op1', 'Test Operation', mockAsyncFunction);
    });

    expect(result.current.operations).toHaveLength(1);

    act(() => {
      result.current.removeOperation('op1');
    });

    expect(result.current.operations).toHaveLength(0);
  });

  it('clears completed operations', async () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockAsyncFunction1 = vi.fn().mockResolvedValue('result1');
    const mockAsyncFunction2 = vi.fn().mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    act(() => {
      result.current.startOperation(
        'op1',
        'Completed Operation',
        mockAsyncFunction1
      );
      result.current.startOperation(
        'op2',
        'Running Operation',
        mockAsyncFunction2
      );
    });

    await waitFor(() => {
      expect(
        result.current.operations.find(op => op.id === 'op1')?.status
      ).toBe('completed');
    });

    expect(result.current.operations).toHaveLength(2);

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.operations).toHaveLength(1);
    expect(result.current.operations[0].id).toBe('op2');
    expect(result.current.operations[0].status).toBe('running');
  });
});
