import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing cleanup of subscriptions and event listeners
 */
export function useCleanup() {
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
}

/**
 * Hook for managing WebSocket subscriptions with automatic cleanup
 */
export function useWebSocketSubscription(
  websocket: any,
  eventType: string,
  handler: (data: any) => void,
  dependencies: React.DependencyList = []
) {
  const { addCleanup } = useCleanup();
  const handlerRef = useRef(handler);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, dependencies);

  useEffect(() => {
    if (!websocket) return;

    const wrappedHandler = (data: any) => {
      handlerRef.current(data);
    };

    websocket.on(eventType, wrappedHandler);
    
    addCleanup(() => {
      websocket.off(eventType, wrappedHandler);
    });
  }, [websocket, eventType, addCleanup]);
}

/**
 * Hook for managing DOM event listeners with automatic cleanup
 */
export function useEventListener<T extends keyof WindowEventMap>(
  eventType: T,
  handler: (event: WindowEventMap[T]) => void,
  element: Window | Document | Element = window,
  options?: boolean | AddEventListenerOptions
) {
  const { addCleanup } = useCleanup();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const wrappedHandler = (event: Event) => {
      handlerRef.current(event as WindowEventMap[T]);
    };

    element.addEventListener(eventType, wrappedHandler, options);
    
    addCleanup(() => {
      element.removeEventListener(eventType, wrappedHandler, options);
    });
  }, [eventType, element, options, addCleanup]);
}

/**
 * Hook for managing intervals with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
  const { addCleanup } = useCleanup();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const interval = setInterval(() => {
      callbackRef.current();
    }, delay);

    addCleanup(() => {
      clearInterval(interval);
    });
  }, [delay, addCleanup]);
}

/**
 * Hook for managing timeouts with automatic cleanup
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const { addCleanup } = useCleanup();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const timeout = setTimeout(() => {
      callbackRef.current();
    }, delay);

    addCleanup(() => {
      clearTimeout(timeout);
    });
  }, [delay, addCleanup]);
}

/**
 * Hook for managing async operations with automatic cleanup
 */
export function useAsyncOperation() {
  const { addCleanup } = useCleanup();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    addCleanup(() => {
      isMountedRef.current = false;
    });
  }, [addCleanup]);

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      const result = await asyncFn();
      
      if (isMountedRef.current && onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (isMountedRef.current && onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, []);

  return { executeAsync, isMounted: () => isMountedRef.current };
}

/**
 * Hook for managing ResizeObserver with automatic cleanup
 */
export function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  element: Element | null
) {
  const { addCleanup } = useCleanup();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element || !window.ResizeObserver) return;

    const observer = new ResizeObserver((entries) => {
      callbackRef.current(entries);
    });

    observer.observe(element);

    addCleanup(() => {
      observer.disconnect();
    });
  }, [element, addCleanup]);
}

/**
 * Hook for managing IntersectionObserver with automatic cleanup
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  element: Element | null,
  options?: IntersectionObserverInit
) {
  const { addCleanup } = useCleanup();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver((entries) => {
      callbackRef.current(entries);
    }, options);

    observer.observe(element);

    addCleanup(() => {
      observer.disconnect();
    });
  }, [element, options, addCleanup]);
}