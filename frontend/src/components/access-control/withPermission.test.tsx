import React from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { withPermission, withAdminPermission, withManagerPermission, withCrudPermission } from './withPermission';
import { useAccessControl } from '../../hooks/useAccessControl';

// Mock the useAccessControl hook
vi.mock('../../hooks/useAccessControl');

const mockUseAccessControl = useAccessControl as any;

const TestComponent: React.FC<{ message?: string }> = ({ message = 'Test Content' }) => (
  <div data-testid="test-component">{message}</div>
);

const CustomFallback: React.FC<any> = (props) => (
  <div data-testid="custom-fallback">Custom Fallback: {props.message}</div>
);

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('withPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic permission checking', () => {
    it('should render wrapped component when user has required permission', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
      });

      render(
        <TestWrapper>
          <WrappedComponent message="Protected Content" />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not render wrapped component when user lacks required permission', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
      });

      render(
        <TestWrapper>
          <WrappedComponent message="Protected Content" />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });

    it('should render default fallback when user lacks permission', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
        showFallback: true,
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You don\'t have the required permissions to access this feature.')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
        fallback: CustomFallback,
      });

      render(
        <TestWrapper>
          <WrappedComponent message="Test Message" />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Fallback: Test Message')).toBeInTheDocument();
    });

    it('should render nothing when showFallback is false', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
        showFallback: false,
      });

      const { container } = render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
      // Should render nothing when showFallback is false
      expect(container.querySelector('[data-testid="test-component"]')).toBeNull();
    });
  });

  describe('multiple permissions', () => {
    it('should render when user has any required permission (requireAll=false)', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permissions: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
        requireAll: false,
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should not render when user lacks all required permissions (requireAll=true)', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permissions: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
        requireAll: true,
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  describe('role-based access', () => {
    it('should render when user has required role', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        hasAllRoles: vi.fn(() => true),
      });

      const WrappedComponent = withPermission(TestComponent, {
        role: 'ADMIN',
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should not render when user lacks required role', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        role: 'ADMIN',
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  describe('combined requirements', () => {
    it('should render when both permission and role requirements are met', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => true),
        hasAnyRole: vi.fn(() => true),
        hasAllRoles: vi.fn(() => true),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
        role: 'MANAGER',
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should not render when only permission requirement is met', () => {
      mockUseAccessControl.mockReturnValue({
        hasPermission: vi.fn(() => true),
        hasAnyPermission: vi.fn(() => true),
        hasAllPermissions: vi.fn(() => true),
        hasRole: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });

      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
        role: 'MANAGER',
      });

      render(
        <TestWrapper>
          <WrappedComponent />
        </TestWrapper>
      );

      expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    });
  });

  describe('display name', () => {
    it('should set correct display name', () => {
      const WrappedComponent = withPermission(TestComponent, {
        permission: 'EMPLOYEE_READ',
      });

      expect(WrappedComponent.displayName).toBe('withPermission(TestComponent)');
    });

    it('should handle components without display name', () => {
      const AnonymousComponent = () => <div>Anonymous</div>;
      const WrappedComponent = withPermission(AnonymousComponent, {
        permission: 'EMPLOYEE_READ',
      });

      expect(WrappedComponent.displayName).toBe('withPermission(AnonymousComponent)');
    });
  });
});

describe('withAdminPermission', () => {
  beforeEach(() => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn((role) => role === 'ADMIN'),
      hasAnyRole: vi.fn((roles) => roles.includes('ADMIN')),
      hasAllRoles: vi.fn((roles) => roles.every(role => role === 'ADMIN')),
    });
  });

  it('should render for admin users', () => {
    const WrappedComponent = withAdminPermission(TestComponent);

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should not render for non-admin users', () => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false),
      hasAllRoles: vi.fn(() => false),
    });

    const WrappedComponent = withAdminPermission(TestComponent);

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });
});

describe('withManagerPermission', () => {
  beforeEach(() => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn((roles) => roles.includes('MANAGER')),
      hasAllRoles: vi.fn(() => false),
    });
  });

  it('should render for manager users', () => {
    const WrappedComponent = withManagerPermission(TestComponent);

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should render for admin users', () => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn((roles) => roles.includes('ADMIN')),
      hasAllRoles: vi.fn(() => false),
    });

    const WrappedComponent = withManagerPermission(TestComponent);

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should not render for regular users', () => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false),
      hasAllRoles: vi.fn(() => false),
    });

    const WrappedComponent = withManagerPermission(TestComponent);

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });
});

describe('withCrudPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when user has required CRUD permission', () => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn((permission) => permission === 'EMPLOYEE_READ'),
      hasAnyPermission: vi.fn((permissions) => permissions.includes('EMPLOYEE_READ')),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false),
      hasAllRoles: vi.fn(() => false),
    });

    const WrappedComponent = withCrudPermission(TestComponent, 'employee', 'read');

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should not render when user lacks required CRUD permission', () => {
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false),
      hasAllRoles: vi.fn(() => false),
    });

    const WrappedComponent = withCrudPermission(TestComponent, 'employee', 'create');

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });

  it('should generate correct permission string', () => {
    const mockHasAnyPermission = vi.fn(() => true);
    mockUseAccessControl.mockReturnValue({
      hasPermission: vi.fn(() => true),
      hasAnyPermission: mockHasAnyPermission,
      hasAllPermissions: vi.fn(() => false),
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false),
      hasAllRoles: vi.fn(() => false),
    });

    const WrappedComponent = withCrudPermission(TestComponent, 'department', 'update');

    render(
      <TestWrapper>
        <WrappedComponent />
      </TestWrapper>
    );

    expect(mockHasAnyPermission).toHaveBeenCalledWith(['DEPARTMENT_UPDATE'], {});
  });
});