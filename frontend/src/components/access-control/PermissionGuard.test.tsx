import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionGuard } from './PermissionGuard';
import { useAccessControl } from '../../hooks/useAccessControl';

// Mock the useAccessControl hook
vi.mock('../../hooks/useAccessControl');

const mockUseAccessControl = useAccessControl as any;

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;
const FallbackComponent = () => <div data-testid="fallback-content">Access Denied</div>;

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('permission-based rendering', () => {
    it('should render children when user has required permission', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
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
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
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
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      render(
        <PermissionGuard permission="EMPLOYEE_READ" fallback={<FallbackComponent />}>
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
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      render(
        <PermissionGuard permissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']} requireAll={false}>
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not render when user has all required permissions but requireAll=true', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      render(
        <PermissionGuard permissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']} requireAll={true}>
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render when user has all required permissions and requireAll=true', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      render(
        <PermissionGuard permissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']} requireAll={true}>
          <TestComponent />
        </PermissionGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('role-based rendering', () => {
    it('should render children when user has required role', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        hasAllRoles: vi.fn(() => true),
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
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
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
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        hasAllRoles: vi.fn(() => true),
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
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
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
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        hasAllRoles: vi.fn(() => true),
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
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

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
        hasPermission: vi.fn(() => true),
        hasAnyPermission: mockHasAnyPermission,
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyRole: mockHasAnyRole,
        hasAllRoles: vi.fn(() => true),
      });

      const options = { strict: true, fallbackValue: false };

      render(
        <PermissionGuard permission="EMPLOYEE_READ" role="MANAGER" options={options}>
          <TestComponent />
        </PermissionGuard>
      );

      expect(mockHasAnyPermission).toHaveBeenCalledWith(['EMPLOYEE_READ'], options);
      expect(mockHasAnyRole).toHaveBeenCalledWith(['MANAGER'], options);
    });
  });
});