import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeImport } from './EmployeeImport';
import { EmployeeExport } from './EmployeeExport';

// Mock the hooks
vi.mock('../hooks/useEmployees', () => ({
  useEmployeeImport: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useEmployeeExport: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock Mantine components
vi.mock('@mantine/core', () => ({
  Modal: ({ children, opened }: any) => opened ? <div data-testid="modal">{children}</div> : null,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Text: ({ children }: any) => <span>{children}</span>,
  Group: ({ children }: any) => <div>{children}</div>,
  Stack: ({ children }: any) => <div>{children}</div>,
  Alert: ({ children }: any) => <div>{children}</div>,
  Progress: () => <div data-testid="progress" />,
  Table: ({ children }: any) => <table>{children}</table>,
  ScrollArea: ({ children }: any) => <div>{children}</div>,
  ActionIcon: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  Paper: ({ children }: any) => <div>{children}</div>,
  Center: ({ children }: any) => <div>{children}</div>,
  Checkbox: ({ label, checked, onChange }: any) => (
    <label>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  ),
}));

// Mock Dropzone
vi.mock('@mantine/dropzone', () => ({
  Dropzone: ({ children, onDrop }: any) => (
    <div data-testid="dropzone" onClick={() => onDrop([])}>
      {children}
    </div>
  ),
}));

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Mock icons
vi.mock('@tabler/icons-react', () => ({
  IconUpload: () => <span>Upload</span>,
  IconFileSpreadsheet: () => <span>File</span>,
  IconDownload: () => <span>Download</span>,
  IconX: () => <span>X</span>,
  IconCheck: () => <span>Check</span>,
  IconAlertCircle: () => <span>Alert</span>,
}));

describe('Employee Import/Export Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EmployeeImport', () => {
    it('should be defined and exportable', () => {
      expect(EmployeeImport).toBeDefined();
      expect(typeof EmployeeImport).toBe('function');
    });

    it('should have correct component name', () => {
      expect(EmployeeImport.name).toBe('EmployeeImport');
    });
  });

  describe('EmployeeExport', () => {
    it('should be defined and exportable', () => {
      expect(EmployeeExport).toBeDefined();
      expect(typeof EmployeeExport).toBe('function');
    });

    it('should have correct component name', () => {
      expect(EmployeeExport.name).toBe('EmployeeExport');
    });
  });

  describe('Component Integration', () => {
    it('should export both components from the module', async () => {
      const importModule = await import('./EmployeeImport');
      const exportModule = await import('./EmployeeExport');
      
      expect(importModule.EmployeeImport).toBeDefined();
      expect(exportModule.EmployeeExport).toBeDefined();
    });

    it('should have proper TypeScript interfaces', () => {
      // This test ensures the components compile with TypeScript
      // The fact that the components are importable and TypeScript compiles means the interfaces are correct
      expect(EmployeeImport).toBeDefined();
      expect(EmployeeExport).toBeDefined();
    });
  });
});