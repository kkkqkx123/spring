/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useAccessControl,
  usePermissionCheck,
  useRoleCheck,
  useResourcePermissions,
} from './useAccessControl';
import { useAuth } from './useAuth';
import type { User, Role, Permission } from '../types';

// Mock the useAuth hook
vi.mock('./useAuth');

const mockUseAuth = useAuth as any;

const mockPermissions: Permission[] = [
  { id: 1, name: 'EMPLOYEE_READ', description: 'Read employees' },
  { id: 2, name: 'EMPLOYEE_CREATE', description: 'Create employees' },
  { id: 3, name: 'EMPLOYEE_UPDATE', description: 'Update employees' },
  { id: 4, name: 'EMPLOYEE_DELETE', description: 'Delete employees' },
  { id: 5, name: 'DEPARTMENT_READ', description: 'Read departments' },
];

const mockRoles: Role[] = [
  {
    id: 1,
    name: 'ADMIN',
    permissions: mockPermissions,
  },
  {
    id: 2,
    name: 'MANAGER',
    permissions: [mockPermissions[0], mockPermissions[1], mockPermissions[2]],
  },
  {
    id: 3,
    name: 'USER',
    permissions: [mockPermissions[0]],
  },
];

const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    roles: [mockRoles[0]],
    enabled: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  } as User,
  manager: {
    id: 2,
    username: 'manager',
    email: 'manager@example.com',
    roles: [mockRoles[1]],
    enabled: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  } as User,
  user: {
    id: 3,
    username: 'user',
    email: 'user@example.com',
    roles: [mockRoles[2]],
    enabled: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  } as User,
};

describe('useAccessControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUsers.admin,
        hasPermission: vi.fn((permission: string) =>
          mockUsers.admin.roles[0].permissions.some(p => p.name === permission)
        ),
        hasRole: vi.fn((role: string) =>
          mockUsers.admin.roles.some(r => r.name === role)
        ),
        hasAnyPermission: vi.fn((permissions: string[]) =>
          permissions.some(permission =>
            mockUsers.admin.roles[0].permissions.some(
              p => p.name === permission
            )
          )
        ),
        hasAllPermissions: vi.fn((permissions: string[]) =>
          permissions.every(permission =>
            mockUsers.admin.roles[0].permissions.some(
              p => p.name === permission
            )
          )
        ),
        hasAnyRole: vi.fn((roles: string[]) =>
          roles.some(role => mockUsers.admin.roles.some(r => r.name === role))
        ),
        hasAllRoles: vi.fn((roles: string[]) =>
          roles.every(role => mockUsers.admin.roles.some(r => r.name === role))
        ),
      });
    });

    it('should have admin privileges', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isManager).toBe(true);
      expect(result.current.hasRole('ADMIN')).toBe(true);
    });

    it('should have all permissions', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.hasPermission('EMPLOYEE_READ')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_CREATE')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_UPDATE')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_DELETE')).toBe(true);
    });

    it('should have CRUD permissions for employee resource', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canRead('employee')).toBe(true);
      expect(result.current.canCreate('employee')).toBe(true);
      expect(result.current.canUpdate('employee')).toBe(true);
      expect(result.current.canDelete('employee')).toBe(true);
      expect(result.current.canAccessResource('employee')).toBe(true);
    });

    it('should return correct resource permissions', () => {
      const { result } = renderHook(() => useAccessControl());
      const permissions = result.current.getResourcePermissions('employee');

      expect(permissions).toEqual({
        create: true,
        read: true,
        update: true,
        delete: true,
      });
    });

    it('should bypass permission checks in non-strict mode', () => {
      const { result } = renderHook(() => useAccessControl());

      // Even if the specific permission doesn't exist, admin should have access
      expect(result.current.hasPermission('NONEXISTENT_PERMISSION')).toBe(true);
      expect(
        result.current.hasPermission('NONEXISTENT_PERMISSION', { strict: true })
      ).toBe(false);
    });
  });

  describe('when user is manager', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUsers.manager,
        hasPermission: vi.fn((permission: string) =>
          mockUsers.manager.roles[0].permissions.some(
            p => p.name === permission
          )
        ),
        hasRole: vi.fn((role: string) =>
          mockUsers.manager.roles.some(r => r.name === role)
        ),
        hasAnyPermission: vi.fn((permissions: string[]) =>
          permissions.some(permission =>
            mockUsers.manager.roles[0].permissions.some(
              p => p.name === permission
            )
          )
        ),
        hasAllPermissions: vi.fn((permissions: string[]) =>
          permissions.every(permission =>
            mockUsers.manager.roles[0].permissions.some(
              p => p.name === permission
            )
          )
        ),
        hasAnyRole: vi.fn((roles: string[]) =>
          roles.some(role => mockUsers.manager.roles.some(r => r.name === role))
        ),
        hasAllRoles: vi.fn((roles: string[]) =>
          roles.every(role =>
            mockUsers.manager.roles.some(r => r.name === role)
          )
        ),
      });
    });

    it('should have manager privileges but not admin', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(true);
      expect(result.current.hasRole('MANAGER')).toBe(true);
      expect(result.current.hasRole('ADMIN')).toBe(false);
    });

    it('should have limited permissions', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.hasPermission('EMPLOYEE_READ')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_CREATE')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_UPDATE')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_DELETE')).toBe(false);
    });

    it('should have limited CRUD permissions', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canRead('employee')).toBe(true);
      expect(result.current.canCreate('employee')).toBe(true);
      expect(result.current.canUpdate('employee')).toBe(true);
      expect(result.current.canDelete('employee')).toBe(false);
      expect(result.current.canAccessResource('employee')).toBe(true);
    });
  });

  describe('when user is regular user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUsers.user,
        hasPermission: vi.fn((permission: string) =>
          mockUsers.user.roles[0].permissions.some(p => p.name === permission)
        ),
        hasRole: vi.fn((role: string) =>
          mockUsers.user.roles.some(r => r.name === role)
        ),
        hasAnyPermission: vi.fn((permissions: string[]) =>
          permissions.some(permission =>
            mockUsers.user.roles[0].permissions.some(p => p.name === permission)
          )
        ),
        hasAllPermissions: vi.fn((permissions: string[]) =>
          permissions.every(permission =>
            mockUsers.user.roles[0].permissions.some(p => p.name === permission)
          )
        ),
        hasAnyRole: vi.fn((roles: string[]) =>
          roles.some(role => mockUsers.user.roles.some(r => r.name === role))
        ),
        hasAllRoles: vi.fn((roles: string[]) =>
          roles.every(role => mockUsers.user.roles.some(r => r.name === role))
        ),
      });
    });

    it('should have minimal privileges', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.hasRole('USER')).toBe(true);
      expect(result.current.hasRole('MANAGER')).toBe(false);
      expect(result.current.hasRole('ADMIN')).toBe(false);
    });

    it('should have read-only permissions', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.hasPermission('EMPLOYEE_READ')).toBe(true);
      expect(result.current.hasPermission('EMPLOYEE_CREATE')).toBe(false);
      expect(result.current.hasPermission('EMPLOYEE_UPDATE')).toBe(false);
      expect(result.current.hasPermission('EMPLOYEE_DELETE')).toBe(false);
    });

    it('should have read-only CRUD permissions', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canRead('employee')).toBe(true);
      expect(result.current.canCreate('employee')).toBe(false);
      expect(result.current.canUpdate('employee')).toBe(false);
      expect(result.current.canDelete('employee')).toBe(false);
      expect(result.current.canAccessResource('employee')).toBe(true);
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        hasPermission: vi.fn(() => false),
        hasRole: vi.fn(() => false),
        hasAnyPermission: vi.fn(() => false),
        hasAllPermissions: vi.fn(() => false),
        hasAnyRole: vi.fn(() => false),
        hasAllRoles: vi.fn(() => false),
      });
    });

    it('should have no privileges', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.hasRole('USER')).toBe(false);
      expect(result.current.hasPermission('EMPLOYEE_READ')).toBe(false);
    });

    it('should return fallback values', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(
        result.current.hasPermission('EMPLOYEE_READ', { fallbackValue: true })
      ).toBe(true);
      expect(result.current.hasRole('USER', { fallbackValue: true })).toBe(
        true
      );
    });
  });

  describe('multiple permissions and roles', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUsers.manager,
        hasPermission: vi.fn((permission: string) =>
          mockUsers.manager.roles[0].permissions.some(
            p => p.name === permission
          )
        ),
        hasRole: vi.fn((role: string) =>
          mockUsers.manager.roles.some(r => r.name === role)
        ),
        hasAnyPermission: vi.fn((permissions: string[]) =>
          permissions.some(permission =>
            mockUsers.manager.roles[0].permissions.some(
              p => p.name === permission
            )
          )
        ),
        hasAllPermissions: vi.fn((permissions: string[]) =>
          permissions.every(permission =>
            mockUsers.manager.roles[0].permissions.some(
              p => p.name === permission
            )
          )
        ),
        hasAnyRole: vi.fn((roles: string[]) =>
          roles.some(role => mockUsers.manager.roles.some(r => r.name === role))
        ),
        hasAllRoles: vi.fn((roles: string[]) =>
          roles.every(role =>
            mockUsers.manager.roles.some(r => r.name === role)
          )
        ),
      });
    });

    it('should check any permission correctly', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(
        result.current.hasAnyPermission(['EMPLOYEE_READ', 'EMPLOYEE_DELETE'])
      ).toBe(true);
      expect(
        result.current.hasAnyPermission([
          'EMPLOYEE_DELETE',
          'DEPARTMENT_DELETE',
        ])
      ).toBe(false);
    });

    it('should check all permissions correctly', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(
        result.current.hasAllPermissions(['EMPLOYEE_READ', 'EMPLOYEE_CREATE'])
      ).toBe(true);
      expect(
        result.current.hasAllPermissions(['EMPLOYEE_READ', 'EMPLOYEE_DELETE'])
      ).toBe(false);
    });

    it('should check any role correctly', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.hasAnyRole(['MANAGER', 'ADMIN'])).toBe(true);
      expect(result.current.hasAnyRole(['ADMIN', 'USER'])).toBe(false);
    });

    it('should check all roles correctly', () => {
      const { result } = renderHook(() => useAccessControl());

      expect(result.current.hasAllRoles(['MANAGER'])).toBe(true);
      expect(result.current.hasAllRoles(['MANAGER', 'ADMIN'])).toBe(false);
    });
  });
});

describe('usePermissionCheck', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUsers.manager,
      hasPermission: vi.fn((permission: string) =>
        mockUsers.manager.roles[0].permissions.some(p => p.name === permission)
      ),
      hasRole: vi.fn(() => false),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
    });
  });

  it('should return permission check result', () => {
    const { result } = renderHook(() => usePermissionCheck('EMPLOYEE_READ'));
    expect(result.current).toBe(true);
  });

  it('should return false for missing permission', () => {
    const { result } = renderHook(() => usePermissionCheck('EMPLOYEE_DELETE'));
    expect(result.current).toBe(false);
  });
});

describe('useRoleCheck', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUsers.manager,
      hasPermission: vi.fn(),
      hasRole: vi.fn((role: string) =>
        mockUsers.manager.roles.some(r => r.name === role)
      ),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
    });
  });

  it('should return role check result', () => {
    const { result } = renderHook(() => useRoleCheck('MANAGER'));
    expect(result.current).toBe(true);
  });

  it('should return false for missing role', () => {
    const { result } = renderHook(() => useRoleCheck('ADMIN'));
    expect(result.current).toBe(false);
  });
});

describe('useResourcePermissions', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUsers.manager,
      hasPermission: vi.fn((permission: string) =>
        mockUsers.manager.roles[0].permissions.some(p => p.name === permission)
      ),
      hasRole: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasAllPermissions: vi.fn(),
      hasAnyRole: vi.fn(),
      hasAllRoles: vi.fn(),
    });
  });

  it('should return resource permissions', () => {
    const { result } = renderHook(() => useResourcePermissions('employee'));

    expect(result.current).toEqual({
      create: true,
      read: true,
      update: true,
      delete: false,
    });
  });
});
