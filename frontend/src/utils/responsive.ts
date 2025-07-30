/**
 * Responsive utilities for consistent breakpoint handling
 */

// Breakpoint values (matching Mantine's default breakpoints)
export const breakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1400,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to get current screen size category
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<Breakpoint>('xl');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.xs) {
        setScreenSize('xs');
      } else if (width < breakpoints.sm) {
        setScreenSize('sm');
      } else if (width < breakpoints.md) {
        setScreenSize('md');
      } else if (width < breakpoints.lg) {
        setScreenSize('lg');
      } else {
        setScreenSize('xl');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

/**
 * Check if current screen size is mobile (xs or sm)
 */
export const useIsMobile = () => {
  const screenSize = useScreenSize();
  return screenSize === 'xs' || screenSize === 'sm';
};

/**
 * Check if current screen size is tablet (md)
 */
export const useIsTablet = () => {
  const screenSize = useScreenSize();
  return screenSize === 'md';
};

/**
 * Check if current screen size is desktop (lg or xl)
 */
export const useIsDesktop = () => {
  const screenSize = useScreenSize();
  return screenSize === 'lg' || screenSize === 'xl';
};

/**
 * Get responsive value based on screen size
 */
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>) => {
  const screenSize = useScreenSize();
  
  // Find the appropriate value for current screen size
  // Falls back to smaller breakpoints if current size not defined
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(screenSize);
  
  for (let i = currentIndex; i >= 0; i--) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }
  }
  
  // Return the first available value if no match found
  return Object.values(values)[0];
};

/**
 * Touch gesture utilities
 */
export interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

export const useTouchGestures = (handlers: TouchGestureHandlers) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    if (handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        handlers.onLongPress?.();
      }, 500);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const minSwipeDistance = 50;
    const maxSwipeTime = 300;

    // Check for tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      handlers.onTap?.();
      return;
    }

    // Check for swipe
    if (deltaTime < maxSwipeTime) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    touchStartRef.current = null;
  };

  const handleTouchMove = () => {
    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
  };
};

import { useState, useEffect, useRef } from 'react';