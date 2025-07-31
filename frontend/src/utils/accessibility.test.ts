import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import {
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReader,
  useLiveRegion,
  checkColorContrast,
  useReducedMotion,
  useHighContrast,
  useAriaId,
  useAriaExpanded,
  useAriaSelected,
  useAccessibleFormField,
} from './accessibility';

// Mock DOM methods
const mockQuerySelectorAll = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockFocus = vi.fn();

Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
});

Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
});

Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
});

Object.defineProperty(document, 'activeElement', {
  value: { focus: mockFocus },
  writable: true,
});

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
});

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuerySelectorAll.mockReturnValue([]);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  describe('useFocusTrap', () => {
    it('should set up focus trap when active', () => {
      const mockContainer = {
        addEventListener: vi.fn(),
        querySelectorAll: vi
          .fn()
          .mockReturnValue([
            document.createElement('button'),
            document.createElement('a'),
          ]),
      };

      const { result } = renderHook(() => useFocusTrap(true));

      // Simulate container ref being set
      act(() => {
        result.current.current = mockContainer as any;
      });

      expect(mockContainer.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should not set up focus trap when inactive', () => {
      renderHook(() => useFocusTrap(false));
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('useKeyboardNavigation', () => {
    const mockItems = ['item1', 'item2', 'item3'];
    const mockOnSelect = vi.fn();

    it('should handle arrow key navigation', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(mockItems, mockOnSelect, 'vertical')
      );

      expect(result.current.focusedIndex).toBe(0);
    });

    it('should call onSelect when Enter is pressed', () => {
      const mockContainer = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
      };

      const { result } = renderHook(() =>
        useKeyboardNavigation(mockItems, mockOnSelect, 'vertical')
      );

      // Simulate container ref being set
      act(() => {
        result.current.containerRef.current = mockContainer as any;
      });

      expect(mockContainer.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('useScreenReader', () => {
    it('should create announcement element', () => {
      const mockCreateElement = vi.fn().mockReturnValue({
        setAttribute: vi.fn(),
        textContent: '',
        className: '',
      });
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
      });

      const { result } = renderHook(() => useScreenReader(), {
        container: document.body,
      });

      act(() => {
        result.current.announce('Test message');
      });

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockAppendChild).toHaveBeenCalled();
    });
  });

  describe('useLiveRegion', () => {
    it('should initialize with message', () => {
      const { result } = renderHook(() => useLiveRegion('Initial message'), {
        container: document.body,
      });
      expect(result.current.message).toBe('Initial message');
    });

    it('should update message', () => {
      const { result } = renderHook(() => useLiveRegion(), {
        container: document.body,
      });

      act(() => {
        result.current.updateMessage('New message');
      });

      expect(result.current.message).toBe('New message');
    });
  });

  describe('checkColorContrast', () => {
    it('should return true for high contrast colors', () => {
      const result = checkColorContrast('#000000', '#ffffff');
      expect(result).toBe(true);
    });

    it('should return false for low contrast colors', () => {
      const result = checkColorContrast('#888888', '#999999');
      expect(result).toBe(false);
    });
  });

  describe('useReducedMotion', () => {
    it('should return false by default', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion(), {
        container: document.body,
      });
      expect(result.current).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useReducedMotion(), {
        container: document.body,
      });
      expect(result.current).toBe(true);
    });
  });

  describe('useHighContrast', () => {
    it('should return false by default', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useHighContrast(), {
        container: document.body,
      });
      expect(result.current).toBe(false);
    });

    it('should return true when user prefers high contrast', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useHighContrast(), {
        container: document.body,
      });
      expect(result.current).toBe(true);
    });
  });

  describe('useAriaId', () => {
    it('should generate unique ID with prefix', () => {
      const { result } = renderHook(() => useAriaId('test'), {
        container: document.body,
      });
      expect(result.current).toMatch(/^test-/);
    });

    it('should use default prefix', () => {
      const { result } = renderHook(() => useAriaId(), {
        container: document.body,
      });
      expect(result.current).toMatch(/^aria-/);
    });
  });

  describe('useAriaExpanded', () => {
    it('should initialize with false by default', () => {
      const { result } = renderHook(() => useAriaExpanded(), {
        container: document.body,
      });
      expect(result.current.expanded).toBe(false);
      expect(result.current['aria-expanded']).toBe(false);
    });

    it('should toggle expanded state', () => {
      const { result } = renderHook(() => useAriaExpanded(), {
        container: document.body,
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.expanded).toBe(true);
      expect(result.current['aria-expanded']).toBe(true);
    });

    it('should expand and collapse', () => {
      const { result } = renderHook(() => useAriaExpanded(), {
        container: document.body,
      });

      act(() => {
        result.current.expand();
      });
      expect(result.current.expanded).toBe(true);

      act(() => {
        result.current.collapse();
      });
      expect(result.current.expanded).toBe(false);
    });
  });

  describe('useAriaSelected', () => {
    const mockItems = ['item1', 'item2', 'item3'];

    it('should initialize with no selection', () => {
      const { result } = renderHook(() => useAriaSelected(mockItems), {
        container: document.body,
      });
      expect(result.current.selectedItems).toEqual([]);
    });

    it('should select single item', () => {
      const { result } = renderHook(() => useAriaSelected(mockItems), {
        container: document.body,
      });

      act(() => {
        result.current.select(1);
      });

      expect(result.current.selectedItems).toEqual([1]);
      expect(result.current.isSelected(1)).toBe(true);
    });

    it('should handle multi-select', () => {
      const { result } = renderHook(() => useAriaSelected(mockItems, true), {
        container: document.body,
      });

      act(() => {
        result.current.select(0);
        result.current.select(2);
      });

      expect(result.current.selectedItems).toHaveLength(2);
      expect(result.current.selectedItems).toContain(0);
      expect(result.current.selectedItems).toContain(2);
    });

    it('should select all items in multi-select mode', () => {
      const { result } = renderHook(() => useAriaSelected(mockItems, true), {
        container: document.body,
      });

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectedItems).toEqual([0, 1, 2]);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useAriaSelected(mockItems, true), {
        container: document.body,
      });

      act(() => {
        result.current.select(0);
        result.current.clearSelection();
      });

      expect(result.current.selectedItems).toEqual([]);
    });
  });

  describe('useAccessibleFormField', () => {
    it('should generate proper ARIA attributes', () => {
      const { result } = renderHook(
        () =>
          useAccessibleFormField(
            'test-field',
            'Test Label',
            true,
            'Error message',
            'Help text'
          ),
        {
          container: document.body,
        }
      );

      expect(result.current.fieldProps.id).toBe('test-field');
      expect(result.current.fieldProps['aria-required']).toBe(true);
      expect(result.current.fieldProps['aria-invalid']).toBe(true);
      expect(result.current.fieldProps['aria-describedby']).toContain(
        'test-field-description'
      );
      expect(result.current.fieldProps['aria-describedby']).toContain(
        'test-field-error'
      );
    });

    it('should handle field without error or description', () => {
      const { result } = renderHook(
        () => useAccessibleFormField('simple-field', 'Simple Label'),
        {
          container: document.body,
        }
      );

      expect(result.current.fieldProps['aria-required']).toBe(false);
      expect(result.current.fieldProps['aria-invalid']).toBe(false);
      expect(result.current.fieldProps['aria-describedby']).toBeUndefined();
    });
  });
});
