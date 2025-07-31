import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/ui/ToastNotifications';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

interface LoadingOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

/**
 * Hook for managing loading states with automatic error handling and retries
 */
export const useLoadingState = (options: LoadingOptions = {}) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const toast = useToast();
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
    onSuccess,
    onError,
    retries = 0,
    retryDelay = 1000,
  } = options;

  const execute = useCallback(async (
    asyncFunction: (signal?: AbortSignal) => Promise<any>
  ) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await asyncFunction(signal);
      
      if (!signal.aborted) {
        setState({
          isLoading: false,
          error: null,
          data: result,
        });

        if (showSuccessToast) {
          toast.success('Success', successMessage);
        }

        onSuccess?.(result);
        retryCountRef.current = 0;
      }

      return result;
    } catch (error) {
      if (!signal.aborted) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        // Retry logic
        if (retryCountRef.current < retries) {
          retryCountRef.current++;
          
          setTimeout(() => {
            if (!signal.aborted) {
              execute(asyncFunction);
            }
          }, retryDelay * Math.pow(2, retryCountRef.current - 1)); // Exponential backoff
          
          return;
        }

        setState({
          isLoading: false,
          error: errorObj,
          data: null,
        });

        if (showErrorToast) {
          toast.error('Error', errorMessage);
        }

        onError?.(errorObj);
        retryCountRef.current = 0;
      }

      throw error;
    }
  }, [
    showSuccessToast,
    showErrorToast,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    retries,
    retryDelay,
    toast,
  ]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      isLoading: false,
      error: null,
      data: null,
    });
    
    retryCountRef.current = 0;
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
    retryCount: retryCountRef.current,
  };
};

/**
 * Hook for managing multiple loading states
 */
export const useMultipleLoadingStates = () => {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: loading,
      },
    }));
  }, []);

  const setError = useCallback((key: string, error: Error | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        isLoading: false,
      },
    }));
  }, []);

  const setData = useCallback((key: string, data: any) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data,
        isLoading: false,
        error: null,
      },
    }));
  }, []);

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { isLoading: false, error: null, data: null };
  }, [states]);

  const isAnyLoading = useCallback(() => {
    return Object.values(states).some(state => state.isLoading);
  }, [states]);

  const hasAnyError = useCallback(() => {
    return Object.values(states).some(state => state.error);
  }, [states]);

  const reset = useCallback((key?: string) => {
    if (key) {
      setStates(prev => {
        const newStates = { ...prev };
        delete newStates[key];
        return newStates;
      });
    } else {
      setStates({});
    }
  }, []);

  return {
    states,
    setLoading,
    setError,
    setData,
    getState,
    isAnyLoading,
    hasAnyError,
    reset,
  };
};

/**
 * Hook for managing form submission states
 */
export const useFormSubmission = <T = any>(options: LoadingOptions = {}) => {
  const loadingState = useLoadingState(options);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const submit = useCallback(async (
    submitFunction: () => Promise<T>,
    validationFunction?: () => Record<string, string> | null
  ) => {
    // Clear previous validation errors
    setValidationErrors({});

    // Run validation if provided
    if (validationFunction) {
      const errors = validationFunction();
      if (errors && Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
    }

    try {
      return await loadingState.execute(submitFunction);
    } catch (error) {
      // Handle validation errors from server
      if (error instanceof Error && 'details' in error) {
        const details = (error as any).details;
        if (typeof details === 'object' && details !== null) {
          setValidationErrors(details);
        }
      }
      throw error;
    }
  }, [loadingState]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  return {
    ...loadingState,
    validationErrors,
    submit,
    clearValidationErrors,
  };
};

/**
 * Hook for managing async operations with progress tracking
 */
export const useAsyncOperation = () => {
  const [operations, setOperations] = useState<Map<string, {
    id: string;
    title: string;
    progress: number;
    status: 'running' | 'completed' | 'error' | 'cancelled';
    error?: Error;
    result?: any;
  }>>(new Map());

  const startOperation = useCallback((
    id: string,
    title: string,
    asyncFunction: (updateProgress: (progress: number) => void) => Promise<any>
  ) => {
    setOperations(prev => new Map(prev).set(id, {
      id,
      title,
      progress: 0,
      status: 'running',
    }));

    const updateProgress = (progress: number) => {
      setOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(id);
        if (operation) {
          newMap.set(id, { ...operation, progress });
        }
        return newMap;
      });
    };

    asyncFunction(updateProgress)
      .then(result => {
        setOperations(prev => {
          const newMap = new Map(prev);
          const operation = newMap.get(id);
          if (operation) {
            newMap.set(id, {
              ...operation,
              progress: 100,
              status: 'completed',
              result,
            });
          }
          return newMap;
        });
      })
      .catch(error => {
        setOperations(prev => {
          const newMap = new Map(prev);
          const operation = newMap.get(id);
          if (operation) {
            newMap.set(id, {
              ...operation,
              status: 'error',
              error,
            });
          }
          return newMap;
        });
      });
  }, []);

  const cancelOperation = useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(id);
      if (operation) {
        newMap.set(id, { ...operation, status: 'cancelled' });
      }
      return newMap;
    });
  }, []);

  const removeOperation = useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setOperations(prev => {
      const newMap = new Map();
      prev.forEach((operation, id) => {
        if (operation.status === 'running') {
          newMap.set(id, operation);
        }
      });
      return newMap;
    });
  }, []);

  return {
    operations: Array.from(operations.values()),
    startOperation,
    cancelOperation,
    removeOperation,
    clearCompleted,
  };
};