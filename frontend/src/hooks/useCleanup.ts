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

// Define a WebSocket-like interface for better type safety
interface WebSocketLike {
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
}

export function useWebSocketSubscription<T>(
  websocket: WebSocketLike | null | undefined,
  eventType: string,
  handler: (data: T) => void
) {
  const { addCleanup } = useCleanup();

  useEffect(() => {
    if (!websocket) return;

    const wrappedHandler = (data: T) => {
      handler(data);
    };

    // Cast to a compatible type for the websocket library
    const castedHandler = wrappedHandler as (data: unknown) => void;

    websocket.on(eventType, castedHandler);

    addCleanup(() => {
      websocket.off(eventType, castedHandler);
    });
  }, [websocket, eventType, addCleanup, handler]);
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
export function useSafeAsyncOperation() {
  const { addCleanup } = useCleanup();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    addCleanup(() => {
      isMountedRef.current = false;
    });
  }, [addCleanup]);

  const executeAsync = useCallback(
    async <T>(
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
    },
    []
  );

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

    const observer = new ResizeObserver(entries => {
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

    const observer = new IntersectionObserver(entries => {
      callbackRef.current(entries);
    }, options);

    observer.observe(element);

    addCleanup(() => {
      observer.disconnect();
    });
  }, [element, options, addCleanup]);
}
