import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useOptimizedCallback,
  useOptimizedMemo,
  useDebouncedState,
  useThrottledState,
  useBatchedUpdates,
  useStableReference,
} from './useOptimizedState';
import { measureRenderPerformance } from '../test/performance-setup';

describe('Optimized State Hooks Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useOptimizedCallback', () => {
    it('should prevent unnecessary callback recreations', () => {
      let callbackCreations = 0;

      const { result, rerender } = renderHook(
        ({ value }) => {
          return useOptimizedCallback(() => {
            callbackCreations++;
            return value * 2;
          }, [value]);
        },
        { initialProps: { value: 1 } }
      );

      const initialCallback = result.current;

      // Rerender with same value - callback should not be recreated
      rerender({ value: 1 });
      expect(result.current).toBe(initialCallback);

      // Rerender with different value - callback should be recreated
      rerender({ value: 2 });
      expect(result.current).not.toBe(initialCallback);
    });

    it('should have minimal performance overhead', async () => {
      const renderTime = await measureRenderPerformance(async () => {
        renderHook(() => {
          return useOptimizedCallback(() => {
            return 'test';
          }, ['dependency']);
        });
      });

      // Should be very fast (< 5ms)
      expect(renderTime).toBeLessThan(5);
    });
  });

  describe('useOptimizedMemo', () => {
    it('should prevent unnecessary computations', () => {
      let computations = 0;

      const { result, rerender } = renderHook(
        ({ value }) => {
          return useOptimizedMemo(() => {
            computations++;
            return value * 2;
          }, [value]);
        },
        { initialProps: { value: 1 } }
      );

      expect(result.current).toBe(2);
      expect(computations).toBe(1);

      // Rerender with same value - should not recompute
      rerender({ value: 1 });
      expect(result.current).toBe(2);
      expect(computations).toBe(1);

      // Rerender with different value - should recompute
      rerender({ value: 2 });
      expect(result.current).toBe(4);
      expect(computations).toBe(2);
    });

    it('should handle custom comparison functions', () => {
      let computations = 0;

      const { rerender } = renderHook(
        ({ obj }) => {
          return useOptimizedMemo(
            () => {
              computations++;
              return obj.value * 2;
            },
            [obj],
            (prev, next) => prev === next
          );
        },
        { initialProps: { obj: { value: 1 } } }
      );

      expect(computations).toBe(1);

      // Rerender with different object but same content
      rerender({ obj: { value: 1 } });
      expect(computations).toBe(2); // Should recompute due to object reference change
    });
  });

  describe('useDebouncedState', () => {
    it('should debounce state updates', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useDebouncedState('initial', 100));

      const [immediateValue, debouncedValue, setValue] = result.current;

      expect(immediateValue).toBe('initial');
      expect(debouncedValue).toBe('initial');

      // Update value multiple times quickly
      act(() => {
        setValue('update1');
      });

      act(() => {
        setValue('update2');
      });

      act(() => {
        setValue('final');
      });

      // Immediate value should be updated
      expect(result.current[0]).toBe('final');
      // Debounced value should still be initial
      expect(result.current[1]).toBe('initial');

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Now debounced value should be updated
      expect(result.current[1]).toBe('final');

      vi.useRealTimers();
    });

    it('should handle rapid updates efficiently', async () => {
      const renderTime = await measureRenderPerformance(async () => {
        const { result } = renderHook(() => useDebouncedState('', 50));

        // Simulate rapid typing
        for (let i = 0; i < 100; i++) {
          act(() => {
            result.current[2](`text${i}`);
          });
        }
      });

      // Should handle rapid updates efficiently
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('useThrottledState', () => {
    it('should throttle state updates', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useThrottledState('initial', 100));

      const [value, setValue] = result.current;
      expect(value).toBe('initial');

      // First update should go through immediately
      act(() => {
        setValue('update1');
      });
      expect(result.current[0]).toBe('update1');

      // Subsequent updates within throttle period should be delayed
      act(() => {
        setValue('update2');
      });
      expect(result.current[0]).toBe('update1'); // Still old value

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current[0]).toBe('update2'); // Now updated

      vi.useRealTimers();
    });
  });

  describe('useBatchedUpdates', () => {
    it('should batch multiple updates', async () => {
      vi.useFakeTimers();

      let updateCount = 0;
      const { result } = renderHook(() => {
        const batchUpdate = useBatchedUpdates();
        return {
          batchUpdate,
          triggerUpdate: () => {
            batchUpdate(() => {
              updateCount++;
            });
          },
        };
      });

      // Trigger multiple updates
      act(() => {
        result.current.triggerUpdate();
        result.current.triggerUpdate();
        result.current.triggerUpdate();
      });

      // Updates should not have executed yet
      expect(updateCount).toBe(0);

      // Fast forward to trigger batch
      act(() => {
        vi.advanceTimersByTime(0);
      });

      // All updates should have been batched and executed
      expect(updateCount).toBe(3);

      vi.useRealTimers();
    });
  });

  describe('useStableReference', () => {
    it('should maintain stable references for identical objects', () => {
      const { result, rerender } = renderHook(
        ({ obj }) => useStableReference(obj),
        { initialProps: { obj: { a: 1, b: 2 } } }
      );

      const initialRef = result.current;

      // Rerender with identical object
      rerender({ obj: { a: 1, b: 2 } });
      expect(result.current).toBe(initialRef);

      // Rerender with different object
      rerender({ obj: { a: 2, b: 2 } });
      expect(result.current).not.toBe(initialRef);
    });

    it('should handle primitive values correctly', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useStableReference(value),
        { initialProps: { value: 'test' } }
      );

      const initialRef = result.current;

      // Rerender with same value
      rerender({ value: 'test' });
      expect(result.current).toBe(initialRef);

      // Rerender with different value
      rerender({ value: 'different' });
      expect(result.current).not.toBe(initialRef);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should handle large datasets efficiently', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: i * 2,
      }));

      const renderTime = await measureRenderPerformance(async () => {
        renderHook(() => {
          return useOptimizedMemo(() => {
            return largeArray.filter(item => item.value > 5000);
          }, [largeArray]);
        });
      });

      // Should handle large datasets reasonably fast
      expect(renderTime).toBeLessThan(100);
    });

    it('should minimize re-renders with complex state', async () => {
      let renderCount = 0;

      const { rerender } = renderHook(
        ({ data }) => {
          renderCount++;
          return useStableReference(data);
        },
        {
          initialProps: {
            data: {
              users: [{ id: 1, name: 'John' }],
              settings: { theme: 'dark' },
            },
          },
        }
      );

      // Rerender with identical data
      rerender({
        data: {
          users: [{ id: 1, name: 'John' }],
          settings: { theme: 'dark' },
        },
      });

      // Should minimize unnecessary renders
      expect(renderCount).toBe(2); // Initial + one rerender
    });
  });
});
