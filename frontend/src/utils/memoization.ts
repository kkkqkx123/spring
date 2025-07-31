import { useMemo, useCallback, useRef, useState, useEffect } from 'react';

/**
 * Memoization utilities for performance optimization
 */

// Deep comparison for complex objects
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (
    a == null ||
    b == null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false;
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(b)) return false;

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !deepEqual(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
}

// Memoization hook with deep comparison
export function useDeepMemo<T>(factory: () => T, deps: readonly unknown[]): T {
  const ref = useRef<{ deps: readonly unknown[]; value: T } | null>(null);

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current!.value;
}

// Stable callback with deep dependency comparison
export function useDeepCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: readonly unknown[]
): T {
  // This hook provides a callback that only changes when its dependencies
  // change, as determined by a deep equality check.
  return useDeepMemo(() => callback, deps);
}

// Memoized selector for Zustand stores
export function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
) {
  let lastResult: R | undefined;
  let lastState: T | undefined;
  let isFirstRun = true;

  return (state: T): R => {
    if (isFirstRun || state !== lastState) {
      const newResult = selector(state);
      if (isFirstRun || !equalityFn(lastResult!, newResult)) {
        lastResult = newResult;
      }
      lastState = state;
      isFirstRun = false;
    }
    return lastResult!;
  };
}

// Debounced value hook for expensive computations
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: unknown[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized computation with cache size limit
export function useMemoizedComputation<T, R>(
  computation: (input: T) => R,
  input: T,
  cacheSize: number = 10
): R {
  const cache = useRef<Map<string, R>>(new Map());

  return useMemo(() => {
    const key = JSON.stringify(input);

    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }

    const result = computation(input);

    // Manage cache size
    if (cache.current.size >= cacheSize) {
      const firstKey = cache.current.keys().next().value;
      if (firstKey !== undefined) {
        cache.current.delete(firstKey);
      }
    }

    cache.current.set(key, result);
    return result;
  }, [input, computation, cacheSize]);
}

// Stable reference hook for objects
export function useStableReference<T>(value: T): T {
  const ref = useRef<T>(value);

  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
