/**
 * Accessibility utilities for WCAG 2.1 compliance
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Focus management utilities
 */

// Focus trap for modals and dialogs
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // This should be handled by the component using the hook
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Keyboard navigation for lists and grids
export const useKeyboardNavigation = <T>(
  items: T[],
  onSelect?: (item: T, index: number) => void,
  orientation: 'horizontal' | 'vertical' | 'grid' = 'vertical'
) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let newIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            e.preventDefault();
            newIndex = Math.min(focusedIndex + 1, items.length - 1);
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            e.preventDefault();
            newIndex = Math.max(focusedIndex - 1, 0);
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            e.preventDefault();
            newIndex = Math.min(focusedIndex + 1, items.length - 1);
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            e.preventDefault();
            newIndex = Math.max(focusedIndex - 1, 0);
          }
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (onSelect && items[focusedIndex]) {
            onSelect(items[focusedIndex], focusedIndex);
          }
          break;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        
        // Focus the corresponding element
        const focusableElements = container.querySelectorAll('[role="option"], [role="gridcell"], [role="button"]');
        const targetElement = focusableElements[newIndex] as HTMLElement;
        if (targetElement) {
          targetElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, items, onSelect, orientation]);

  return {
    containerRef,
    focusedIndex,
    setFocusedIndex,
  };
};

/**
 * Screen reader utilities
 */

// Announce messages to screen readers
export const useScreenReader = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};

// Live region for dynamic content updates
export const useLiveRegion = (initialMessage = '') => {
  const [message, setMessage] = useState(initialMessage);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateMessage = (newMessage: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage(newMessage);
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
    }
  };

  return {
    liveRegionRef,
    message,
    updateMessage,
  };
};

/**
 * Color contrast utilities
 */

// Check if color contrast meets WCAG AA standards
export const checkColorContrast = (foreground: string, background: string): boolean => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return contrast >= 4.5; // WCAG AA standard
};

/**
 * Reduced motion utilities
 */

// Check if user prefers reduced motion
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * High contrast mode utilities
 */

// Check if user is in high contrast mode
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

/**
 * ARIA utilities
 */

// Generate unique IDs for ARIA relationships
export const useAriaId = (prefix = 'aria') => {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
};

// Manage ARIA expanded state
export const useAriaExpanded = (initialExpanded = false) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  
  const toggle = () => setExpanded(!expanded);
  const expand = () => setExpanded(true);
  const collapse = () => setExpanded(false);

  return {
    expanded,
    toggle,
    expand,
    collapse,
    'aria-expanded': expanded,
  };
};

// Manage ARIA selected state for lists
export const useAriaSelected = <T>(items: T[], multiSelect = false) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const isSelected = (index: number) => selectedItems.has(index);

  const select = (index: number) => {
    if (multiSelect) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set([index]));
    }
  };

  const selectAll = () => {
    if (multiSelect) {
      setSelectedItems(new Set(items.map((_, index) => index)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  return {
    selectedItems: Array.from(selectedItems),
    isSelected,
    select,
    selectAll,
    clearSelection,
  };
};

/**
 * Form accessibility utilities
 */

// Enhanced form field with accessibility features
export const useAccessibleFormField = (
  fieldId: string,
  label: string,
  required = false,
  error?: string,
  description?: string
) => {
  const labelId = `${fieldId}-label`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;

  const getAriaDescribedBy = () => {
    const describedBy = [];
    if (description) describedBy.push(descriptionId);
    if (error) describedBy.push(errorId);
    return describedBy.length > 0 ? describedBy.join(' ') : undefined;
  };

  return {
    fieldProps: {
      id: fieldId,
      'aria-labelledby': labelId,
      'aria-describedby': getAriaDescribedBy(),
      'aria-required': required,
      'aria-invalid': !!error,
    },
    labelProps: {
      id: labelId,
      htmlFor: fieldId,
    },
    errorProps: {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite',
    },
    descriptionProps: {
      id: descriptionId,
    },
  };
};

/**
 * Skip link utilities
 */

// Create skip links for keyboard navigation
export const useSkipLinks = (links: Array<{ href: string; label: string }>) => {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (skipLinksRef.current?.contains(e.target as Node)) {
        skipLinksRef.current.style.transform = 'translateY(0)';
      }
    };

    const handleBlur = (e: FocusEvent) => {
      if (skipLinksRef.current?.contains(e.target as Node)) {
        skipLinksRef.current.style.transform = 'translateY(-100%)';
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return {
    skipLinksRef,
    links,
  };
};