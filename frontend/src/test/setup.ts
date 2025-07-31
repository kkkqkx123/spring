/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend({ toHaveNoViolations });

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: (obj: Blob | MediaSource) => {
    if (obj instanceof Blob) {
      return `blob:${obj.type}`;
    }
    return 'blob:';
  },
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: () => {},
});

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('default'),
  })),
});

// Setup Mantine Portal testing environment
// Create a container for portal content
const portalContainer = document.createElement('div');
portalContainer.setAttribute('data-mantine-portal-container', 'true');
document.body.appendChild(portalContainer);

// Mock createPortal to render into our test container
vi.mock('react-dom', async () => {
  const actual = (await vi.importActual('react-dom')) as any;
  return {
    ...actual,
    createPortal: (children: any) => {
      // For testing, render children directly instead of using portal
      return children;
    },
  };
});
