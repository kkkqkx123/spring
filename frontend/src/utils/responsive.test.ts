import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  useScreenSize,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useResponsiveValue,
  useTouchGestures,
} from './responsive';

// Mock window.innerWidth
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

// Mock window.addEventListener and removeEventListener
const mockEventListener = () => {
  const listeners: { [key: string]: EventListener[] } = {};

  window.addEventListener = vi.fn((event: string, listener: EventListener) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(listener);
  });

  window.removeEventListener = vi.fn(
    (event: string, listener: EventListener) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== listener);
      }
    }
  );

  return {
    trigger: (event: string) => {
      if (listeners[event]) {
        listeners[event].forEach(listener => listener(new Event(event)));
      }
    },
  };
};

describe('Responsive Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useScreenSize', () => {
    it('should return xs for screen width < 576px', () => {
      mockInnerWidth(500);
      mockEventListener();

      const { result } = renderHook(() => useScreenSize());
      expect(result.current).toBe('xs');
    });

    it('should return sm for screen width 576-767px', () => {
      mockInnerWidth(700);
      mockEventListener();

      const { result } = renderHook(() => useScreenSize());
      expect(result.current).toBe('sm');
    });

    it('should return md for screen width 768-991px', () => {
      mockInnerWidth(900);
      mockEventListener();

      const { result } = renderHook(() => useScreenSize());
      expect(result.current).toBe('md');
    });

    it('should return lg for screen width 992-1199px', () => {
      mockInnerWidth(1100);
      mockEventListener();

      const { result } = renderHook(() => useScreenSize());
      expect(result.current).toBe('lg');
    });

    it('should return xl for screen width >= 1200px', () => {
      mockInnerWidth(1300);
      mockEventListener();

      const { result } = renderHook(() => useScreenSize());
      expect(result.current).toBe('xl');
    });

    it('should update screen size on window resize', () => {
      mockInnerWidth(500);
      const { trigger } = mockEventListener();

      const { result } = renderHook(() => useScreenSize());
      expect(result.current).toBe('xs');

      act(() => {
        mockInnerWidth(1300);
        trigger('resize');
      });

      expect(result.current).toBe('xl');
    });
  });

  describe('useIsMobile', () => {
    it('should return true for xs screen size', () => {
      mockInnerWidth(500);
      mockEventListener();

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return true for sm screen size', () => {
      mockInnerWidth(700);
      mockEventListener();

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for md and larger screen sizes', () => {
      mockInnerWidth(900);
      mockEventListener();

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true for md screen size', () => {
      mockInnerWidth(900);
      mockEventListener();

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return false for non-md screen sizes', () => {
      mockInnerWidth(700);
      mockEventListener();

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('should return true for lg screen size', () => {
      mockInnerWidth(1100);
      mockEventListener();

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return true for xl screen size', () => {
      mockInnerWidth(1300);
      mockEventListener();

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false for smaller screen sizes', () => {
      mockInnerWidth(900);
      mockEventListener();

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });
  });

  describe('useResponsiveValue', () => {
    it('should return appropriate value for current screen size', () => {
      mockInnerWidth(900); // md
      mockEventListener();

      const values = {
        xs: 'mobile',
        sm: 'mobile',
        md: 'tablet',
        lg: 'desktop',
        xl: 'desktop',
      };

      const { result } = renderHook(() => useResponsiveValue(values));
      expect(result.current).toBe('tablet');
    });

    it('should fallback to smaller breakpoint if current not defined', () => {
      mockInnerWidth(900); // md
      mockEventListener();

      const values = {
        xs: 'mobile',
        lg: 'desktop',
      };

      const { result } = renderHook(() => useResponsiveValue(values));
      expect(result.current).toBe('mobile');
    });

    it('should return first available value if no match found', () => {
      mockInnerWidth(500); // xs
      mockEventListener();

      const values = {
        lg: 'desktop',
        xl: 'large-desktop',
      };

      const { result } = renderHook(() => useResponsiveValue(values));
      expect(result.current).toBe('desktop');
    });
  });

  describe('useTouchGestures', () => {
    it('should call onTap for quick touch', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onTap }));

      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      const touchEnd = {
        changedTouches: [{ clientX: 105, clientY: 105 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
      });

      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onTap).toHaveBeenCalled();
    });

    it('should call onSwipeRight for right swipe', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onSwipeRight }));

      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      const touchEnd = {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
      });

      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should call onSwipeLeft for left swipe', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onSwipeLeft }));

      const touchStart = {
        touches: [{ clientX: 200, clientY: 100 }],
      } as React.TouchEvent;

      const touchEnd = {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
      });

      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should call onSwipeUp for up swipe', () => {
      const onSwipeUp = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onSwipeUp }));

      const touchStart = {
        touches: [{ clientX: 100, clientY: 200 }],
      } as React.TouchEvent;

      const touchEnd = {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
      });

      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeUp).toHaveBeenCalled();
    });

    it('should call onSwipeDown for down swipe', () => {
      const onSwipeDown = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onSwipeDown }));

      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      const touchEnd = {
        changedTouches: [{ clientX: 100, clientY: 200 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
      });

      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeDown).toHaveBeenCalled();
    });

    it('should call onLongPress after timeout', async () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onLongPress }));

      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
      });

      await new Promise(resolve => setTimeout(resolve, 600));
      expect(onLongPress).toHaveBeenCalled();
    });

    it('should cancel long press on touch move', async () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useTouchGestures({ onLongPress }));

      const touchStart = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(touchStart);
        result.current.onTouchMove();
      });

      await new Promise(resolve => setTimeout(resolve, 600));
      expect(onLongPress).not.toHaveBeenCalled();
    });
  });
});
