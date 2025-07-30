import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useStore } from 'zustand';
import { shallow } from 'zustand/shallow';

/**
 * Hook for optimized state selection from Zustand stores
 * Prevents unnecessary re-renders by using shallow comparison
 */
export function useOptimizedStore<T, U>(
  store: any,
  selector: (state: T) => U,
  equalityFn = shallow
) {
  return useStore(store, selector, equalityFn);
}

/**
 * Hook for memoized callbacks with dependency optimization
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  // Use ref to track if dependencies have actually changed
  const depsRef = useRef<React.DependencyList>(deps);
  const callbackRef = useRef<T>(callback);

  const hasChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => !Object.is(dep, depsRef.current[index]));
  }, deps);

  if (hasChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return useCallback(callbackRef.current, deps);
}

/**
 * Hook for memoized values with deep comparison optimization
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  compare?: (prev: T, next: T) => boolean
): T {
  const valueRef = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  const hasChanged = useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => !Object.is(dep, depsRef.current![index]));
  }, deps);

  if (hasChanged) {
    const newValue = factory();

    if (compare && valueRef.current !== undefined) {
      if (!compare(valueRef.current, newValue)) {
        valueRef.current = newValue;
        depsRef.current = deps;
      }
    } else {
      valueRef.current = newValue;
      depsRef.current = deps;
    }
  }

  return valueRef.current!;
}

/**
 * Hook for debounced state updates to prevent excessive re-renders
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback(
    (value: T) => {
      setImmediateValue(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [immediateValue, debouncedValue, setValue];
}

/**
 * Hook for throttled state updates
 */
export function useThrottledState<T>(
  initialValue: T,
  delay: number = 100
): [T, (value: T) => void] {
  const [value, setValue] = React.useState(initialValue);
  const lastUpdateRef = useRef<number>(0);
  const pendingValueRef = useRef<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setThrottledValue = useCallback(
    (newValue: T) => {
      pendingValueRef.current = newValue;
      const now = Date.now();

      if (now - lastUpdateRef.current >= delay) {
        setValue(newValue);
        lastUpdateRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            setValue(pendingValueRef.current);
            lastUpdateRef.current = Date.now();
          },
          delay - (now - lastUpdateRef.current)
        );
      }
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setThrottledValue];
}

/**
 * Hook for batched state updates
 */
export function useBatchedUpdates() {
  const updatesRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((updateFn: () => void) => {
    updatesRef.current.push(updateFn);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      React.startTransition(() => {
        updatesRef.current.forEach(fn => fn());
        updatesRef.current = [];
      });
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return batchUpdate;
}

/**
 * Hook for preventing unnecessary re-renders of child components
 */
export function useStableReference<T>(value: T): T {
  const ref = useRef<T>(value);

  // Only update if the value has actually changed (deep comparison for objects)
  if (typeof value === 'object' && value !== null) {
    if (JSON.stringify(ref.current) !== JSON.stringify(value)) {
      ref.current = value;
    }
  } else if (ref.current !== value) {
    ref.current = value;
  }

  return ref.current;
}
