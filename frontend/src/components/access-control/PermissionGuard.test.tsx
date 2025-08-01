import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionGuard } from './PermissionGuard';
import { useAccessControl } from '../../hooks/useAccessControl';

// Mock the useAccessControl hook
vi.mock('../../hooks/useAccessControl');

const mockUseAccessControl = vi.mocked(useAccessControl);

const TestComponent = () => (
  <div data-testid="protected-content">Protected Content</div>
);
const FallbackComponent = () => (
  <div data-testid="fallback-content">Access Denied</div>
);

const mockAccessControlDefaults: ReturnType<typeof useAccessControl> = {
  hasPermission: vi.fn(),
  hasRole: vi.fn(),
  hasAnyPermission: vi.fn(),
  hasAllPermissions: vi.fn(),
  hasAnyRole: vi.fn(),
  hasAllRoles: vi.fn(),
  canCreate: vi.fn(),
  canRead: vi.fn(),
  canUpdate: vi.fn(),
  canDelete: vi.fn(),
  canAccessResource: vi.fn(),
  getResourcePermissions: vi.fn(),
  isAdmin: false,
  isManager: false,
  userPermissions: [],
  userRoles: [],
  isAuthenticated: true,
  user: null,
};

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default values before each test
    mockUseAccessControl.mockReturnValue(mockAccessControlDefaults);
  });

  describe('permission-based rendering', () => {
    it('should render children when user has required permission', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
      });

      render(
        <PermissionGuard permission="EMPLOYEE_READ">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required permission', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
      });

      render(
        <PermissionGuard permission="EMPLOYEE_READ">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission and fallback is provided', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
      });

      render(
        <PermissionGuard
          permission="EMPLOYEE_READ"
          fallback={<FallbackComponent />}
        >
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
  });

  describe('multiple permissions', () => {
    it('should render when user has any of the required permissions (requireAll=false)', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasAnyPermission: vi.fn(() => true),
      });

      render(
        <PermissionGuard
          permissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']}
          requireAll={false}
        >
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when user has all required permissions but requireAll=true', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasAllPermissions: vi.fn(() => false),
      });

      render(
        <PermissionGuard
          permissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']}
          requireAll={true}
        >
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render when user has all required permissions and requireAll=true', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasAllPermissions: vi.fn(() => true),
      });

      render(
        <PermissionGuard
          permissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']}
          requireAll={true}
        >
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('role-based rendering', () => {
    it('should render children when user has required role', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
      });

      render(
        <PermissionGuard role="ADMIN">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render children when user lacks required role', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
      });

      render(
        <PermissionGuard role="ADMIN">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('combined permission and role requirements', () => {
    it('should render when both permission and role requirements are met', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasPermission: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
      });

      render(
        <PermissionGuard permission="EMPLOYEE_READ" role="MANAGER">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when permission requirement is met but role requirement is not', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
      });

      render(
        <PermissionGuard permission="EMPLOYEE_READ" role="MANAGER">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should not render when role requirement is met but permission requirement is not', () => {
      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
      });

      render(
        <PermissionGuard permission="EMPLOYEE_READ" role="MANAGER">
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('no requirements', () => {
    it('should render children when no requirements are specified', () => {
      // No specific mock setup needed, default should suffice
      render(
        <PermissionGuard>
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('options passing', () => {
    it('should pass options to access control methods', () => {
      const mockHasAnyPermission = vi.fn(() => true);
      const mockHasAnyRole = vi.fn(() => true);

      mockUseAccessControl.mockReturnValue({
        ...mockAccessControlDefaults,
        hasAnyPermission: mockHasAnyPermission,
        hasAnyRole: mockHasAnyRole,
      });

      const options = { strict: true, fallbackValue: false };

      render(
        <PermissionGuard
          permission="EMPLOYEE_READ"
          role="MANAGER"
          options={options}
        >
          <TestComponent />
        </PermissionGuard>
      );

      expect(mockHasAnyPermission).toHaveBeenCalledWith(
        ['EMPLOYEE_READ'],
        options
      );
      expect(mockHasAnyRole).toHaveBeenCalledWith(['MANAGER'], options);
    });
  });
});
