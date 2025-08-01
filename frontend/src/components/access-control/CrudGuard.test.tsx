import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { CrudGuard } from './CrudGuard';
import { useAccessControl } from '../../hooks/useAccessControl';

// Mock the useAccessControl hook
vi.mock('../../hooks/useAccessControl');

const mockUseAccessControl = useAccessControl as Mock;

const TestComponent = () => (
  <div data-testid="protected-content">Protected Content</div>
);
const FallbackComponent = () => (
  <div data-testid="fallback-content">Access Denied</div>
);

describe('CrudGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create action', () => {
    it('should render children when user can create resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => true),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="create">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user cannot create resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="create">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('read action', () => {
    it('should render children when user can read resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => true),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="read">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user cannot read resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="read">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('update action', () => {
    it('should render children when user can update resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => true),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="update">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user cannot update resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="update">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('delete action', () => {
    it('should render children when user can delete resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => true),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="delete">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user cannot delete resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="delete">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('any action', () => {
    it('should render children when user can access resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => true),
      });

      render(
        <CrudGuard resource="employee" action="any">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user cannot access resource', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="employee" action="any">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('fallback rendering', () => {
    it('should render fallback when user lacks permission and fallback is provided', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard
          resource="employee"
          action="read"
          fallback={<FallbackComponent />}
        >
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });

    it('should render nothing when user lacks permission and no fallback is provided', () => {
      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      const { container } = render(
        <CrudGuard resource="employee" action="read">
          <TestComponent />
        </CrudGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('options passing', () => {
    it('should pass options to access control methods', () => {
      const mockCanRead = vi.fn(() => true);

      mockUseAccessControl.mockReturnValue({
        canCreate: vi.fn(() => false),
        canRead: mockCanRead,
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      const options = { strict: true, fallbackValue: false };

      render(
        <CrudGuard resource="employee" action="read" options={options}>
          <TestComponent />
        </CrudGuard>
      );

      expect(mockCanRead).toHaveBeenCalledWith('employee', options);
    });
  });

  describe('resource name handling', () => {
    it('should work with different resource names', () => {
      const mockCanCreate = vi.fn(() => true);

      mockUseAccessControl.mockReturnValue({
        canCreate: mockCanCreate,
        canRead: vi.fn(() => false),
        canUpdate: vi.fn(() => false),
        canDelete: vi.fn(() => false),
        canAccessResource: vi.fn(() => false),
      });

      render(
        <CrudGuard resource="department" action="create">
          <TestComponent />
        </CrudGuard>
      );

      expect(mockCanCreate).toHaveBeenCalledWith('department', {});
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
