import { useEffect, useRef, useCallback } from 'react';
import type { DependencyList } from 'react';

/**
 * Cleanup management utilities for proper resource disposal
 */

export type CleanupFunction = () => void;

// Cleanup manager class
export class CleanupManager {
  private cleanupFunctions: Set<CleanupFunction> = new Set();
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private eventListeners: Set<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = new Set();
  private abortControllers: Set<AbortController> = new Set();

  // Add a cleanup function
  add(cleanup: CleanupFunction): void {
    this.cleanupFunctions.add(cleanup);
  }

  // Remove a cleanup function
  remove(cleanup: CleanupFunction): void {
    this.cleanupFunctions.delete(cleanup);
  }

  // Add a timer to be cleaned up
  addTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  // Add an interval to be cleaned up
  addInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  // Add an event listener to be cleaned up
  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.eventListeners.add({ element, event, handler, options });
  }

  // Add an abort controller to be cleaned up
  addAbortController(controller: AbortController): void {
    this.abortControllers.add(controller);
  }

  // Create a managed timeout
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(timer);
    }, delay);
    this.addTimer(timer);
    return timer;
  }

  // Create a managed interval
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.addInterval(interval);
    return interval;
  }

  // Create a managed abort controller
  createAbortController(): AbortController {
    const controller = new AbortController();
    this.addAbortController(controller);
    return controller;
  }

  // Execute all cleanup functions
  cleanup(): void {
    // Clear timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners.clear();

    // Abort controllers
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.abortControllers.clear();

    // Execute cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions.clear();
  }

  // Get cleanup statistics
  getStats() {
    return {
      cleanupFunctions: this.cleanupFunctions.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
      abortControllers: this.abortControllers.size,
    };
  }
}

// Hook for cleanup management
export function useCleanupManager() {
  const cleanupManagerRef = useRef<CleanupManager>(null);

  if (!cleanupManagerRef.current) {
    cleanupManagerRef.current = new CleanupManager();
  }

  const manager = cleanupManagerRef.current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.cleanup();
    };
  }, [manager]);

  const addCleanup = useCallback(
    (cleanup: CleanupFunction) => {
      manager.add(cleanup);
    },
    [manager]
  );

  const removeCleanup = useCallback(
    (cleanup: CleanupFunction) => {
      manager.remove(cleanup);
    },
    [manager]
  );

  const addTimer = useCallback(
    (timer: NodeJS.Timeout) => {
      manager.addTimer(timer);
    },
    [manager]
  );

  const addInterval = useCallback(
    (interval: NodeJS.Timeout) => {
      manager.addInterval(interval);
    },
    [manager]
  );

  const addEventListener = useCallback(
    (
      element: EventTarget,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      manager.addEventListener(element, event, handler, options);
    },
    [manager]
  );

  const createAbortController = useCallback(() => {
    return manager.createAbortController();
  }, [manager]);

  const setTimeout = useCallback(
    (callback: () => void, delay: number) => {
      return manager.setTimeout(callback, delay);
    },
    [manager]
  );

  const setInterval = useCallback(
    (callback: () => void, delay: number) => {
      return manager.setInterval(callback, delay);
    },
    [manager]
  );

  const cleanup = useCallback(() => {
    manager.cleanup();
  }, [manager]);

  const getStats = useCallback(() => {
    return manager.getStats();
  }, [manager]);

  return {
    addCleanup,
    removeCleanup,
    addTimer,
    addInterval,
    addEventListener,
    createAbortController,
    setTimeout,
    setInterval,
    cleanup,
    getStats,
  };
}

// Hook for automatic subscription cleanup
export function useSubscriptionCleanup() {
  const subscriptions = useRef<Set<() => void>>(new Set());

  const addSubscription = useCallback((unsubscribe: () => void) => {
    subscriptions.current.add(unsubscribe);

    // Return a function to manually unsubscribe
    return () => {
      unsubscribe();
      subscriptions.current.delete(unsubscribe);
    };
  }, []);

  const clearSubscriptions = useCallback(() => {
    subscriptions.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
    });
    subscriptions.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSubscriptions();
    };
  }, [clearSubscriptions]);

  return {
    addSubscription,
    clearSubscriptions,
    getSubscriptionCount: () => subscriptions.current.size,
  };
}

// Hook for WebSocket subscription cleanup
export function useWebSocketSubscriptions() {
  const { addSubscription, clearSubscriptions, getSubscriptionCount } =
    useSubscriptionCleanup();

  const subscribeToWebSocket = useCallback(
    <T>(
      service: {
        subscribe: (event: string, callback: (data: T) => void) => () => void;
      },
      event: string,
      callback: (data: T) => void
    ) => {
      const unsubscribe = service.subscribe(event, callback);
      return addSubscription(unsubscribe);
    },
    [addSubscription]
  );

  return {
    subscribeToWebSocket,
    clearSubscriptions,
    getSubscriptionCount,
  };
}

// Hook for DOM event listener cleanup
export function useDOMEventListeners() {
  const { addEventListener, cleanup, getStats } = useCleanupManager();

  const addDOMEventListener = useCallback(
    (
      element: EventTarget,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      addEventListener(element, event, handler, options);
    },
    [addEventListener]
  );

  const addWindowEventListener = useCallback(
    (
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      addDOMEventListener(window, event, handler, options);
    },
    [addDOMEventListener]
  );

  const addDocumentEventListener = useCallback(
    (
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      addDOMEventListener(document, event, handler, options);
    },
    [addDOMEventListener]
  );

  return {
    addDOMEventListener,
    addWindowEventListener,
    addDocumentEventListener,
    cleanup,
    getStats,
  };
}

// Hook for async operation cleanup
export function useAsyncCleanup() {
  const { createAbortController } = useCleanupManager();

  const createCancellablePromise = useCallback(
    <T>(promiseFactory: (signal: AbortSignal) => Promise<T>): Promise<T> => {
      const controller = createAbortController();

      return promiseFactory(controller.signal).catch(error => {
        if (error.name === 'AbortError') {
          console.log('Promise was cancelled');
          throw error;
        }
        throw error;
      });
    },
    [createAbortController]
  );

  const createCancellableFetch = useCallback(
    (url: string, options?: RequestInit): Promise<Response> => {
      return createCancellablePromise(signal =>
        fetch(url, { ...options, signal })
      );
    },
    [createCancellablePromise]
  );

  return {
    createCancellablePromise,
    createCancellableFetch,
  };
}

// Hook for resource cleanup with dependencies
export function useResourceCleanup(dependencies: DependencyList = []) {
  const { addCleanup, cleanup } = useCleanupManager();

  // Cleanup when dependencies change
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup, dependencies]);

  return { addCleanup, cleanup };
}
