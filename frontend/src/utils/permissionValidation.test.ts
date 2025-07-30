import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import {
  permissionValidator,
  validatePermission,
  validateAnyPermission,
  validateAllPermissions,
  validateCrudOperation,
  validateRole,
  validateRoles,
  PermissionError,
  RoleError,
} from './permissionValidation';
import type { User, Role, Permission } from '../types';

// Mock the auth store
vi.mock('../stores/authStore');

const mockUseAuthStore = useAuthStore as any;

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

describe('PermissionValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePermission', () => {
    it('should return allowed=true when user has required permission', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validatePermission('EMPLOYEE_READ');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return allowed=false when user lacks required permission', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      const result = permissionValidator.validatePermission('EMPLOYEE_DELETE');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required permission: EMPLOYEE_DELETE');
      expect(result.requiredPermissions).toEqual(['EMPLOYEE_DELETE']);
      expect(result.userPermissions).toEqual(['EMPLOYEE_READ']);
    });

    it('should return allowed=true for admin users in non-strict mode', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.admin }));

      const result = permissionValidator.validatePermission('NONEXISTENT_PERMISSION');

      expect(result.allowed).toBe(true);
    });

    it('should return allowed=false for admin users in strict mode', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.admin }));

      const result = permissionValidator.validatePermission('NONEXISTENT_PERMISSION', { strict: true });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required permission: NONEXISTENT_PERMISSION');
    });

    it('should return allowed=false when user is not authenticated', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: null }));

      const result = permissionValidator.validatePermission('EMPLOYEE_READ');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User not authenticated');
      expect(result.requiredPermissions).toEqual(['EMPLOYEE_READ']);
      expect(result.userPermissions).toEqual([]);
    });

    it('should throw error when throwOnFailure is true', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      expect(() => {
        permissionValidator.validatePermission('EMPLOYEE_DELETE', { throwOnFailure: true });
      }).toThrow('Missing required permission: EMPLOYEE_DELETE');
    });
  });

  describe('validateAnyPermission', () => {
    it('should return allowed=true when user has any of the required permissions', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateAnyPermission(['EMPLOYEE_READ', 'EMPLOYEE_DELETE']);

      expect(result.allowed).toBe(true);
    });

    it('should return allowed=false when user has none of the required permissions', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      const result = permissionValidator.validateAnyPermission(['EMPLOYEE_CREATE', 'EMPLOYEE_DELETE']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing any of required permissions: EMPLOYEE_CREATE, EMPLOYEE_DELETE');
      expect(result.requiredPermissions).toEqual(['EMPLOYEE_CREATE', 'EMPLOYEE_DELETE']);
    });

    it('should return allowed=true for admin users in non-strict mode', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.admin }));

      const result = permissionValidator.validateAnyPermission(['NONEXISTENT_PERMISSION']);

      expect(result.allowed).toBe(true);
    });

    it('should throw error when throwOnFailure is true', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      expect(() => {
        permissionValidator.validateAnyPermission(['EMPLOYEE_CREATE', 'EMPLOYEE_DELETE'], { throwOnFailure: true });
      }).toThrow('Missing any of required permissions: EMPLOYEE_CREATE, EMPLOYEE_DELETE');
    });
  });

  describe('validateAllPermissions', () => {
    it('should return allowed=true when user has all required permissions', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateAllPermissions(['EMPLOYEE_READ', 'EMPLOYEE_CREATE']);

      expect(result.allowed).toBe(true);
    });

    it('should return allowed=false when user lacks some required permissions', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateAllPermissions(['EMPLOYEE_READ', 'EMPLOYEE_DELETE']);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required permissions: EMPLOYEE_DELETE');
      expect(result.requiredPermissions).toEqual(['EMPLOYEE_READ', 'EMPLOYEE_DELETE']);
    });

    it('should return allowed=true for admin users in non-strict mode', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.admin }));

      const result = permissionValidator.validateAllPermissions(['NONEXISTENT_PERMISSION']);

      expect(result.allowed).toBe(true);
    });

    it('should throw error when throwOnFailure is true', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      expect(() => {
        permissionValidator.validateAllPermissions(['EMPLOYEE_CREATE', 'EMPLOYEE_DELETE'], { throwOnFailure: true });
      }).toThrow('Missing required permissions: EMPLOYEE_CREATE, EMPLOYEE_DELETE');
    });
  });

  describe('validateCrudOperation', () => {
    it('should validate create operation correctly', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateCrudOperation('employee', 'create');

      expect(result.allowed).toBe(true);
    });

    it('should validate read operation correctly', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      const result = permissionValidator.validateCrudOperation('employee', 'read');

      expect(result.allowed).toBe(true);
    });

    it('should validate update operation correctly', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      const result = permissionValidator.validateCrudOperation('employee', 'update');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required permission: EMPLOYEE_UPDATE');
    });

    it('should validate delete operation correctly', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateCrudOperation('employee', 'delete');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required permission: EMPLOYEE_DELETE');
    });

    it('should handle different resource names', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.admin }));

      const result = permissionValidator.validateCrudOperation('department', 'read');

      expect(result.allowed).toBe(true);
    });
  });

  describe('validateRole', () => {
    it('should return allowed=true when user has required role', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateRole('MANAGER');

      expect(result.allowed).toBe(true);
    });

    it('should return allowed=false when user lacks required role', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      const result = permissionValidator.validateRole('ADMIN');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required role: ADMIN');
    });

    it('should return allowed=false when user is not authenticated', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: null }));

      const result = permissionValidator.validateRole('USER');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User not authenticated');
    });

    it('should throw error when throwOnFailure is true', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      expect(() => {
        permissionValidator.validateRole('ADMIN', { throwOnFailure: true });
      }).toThrow('Missing required role: ADMIN');
    });
  });

  describe('validateRoles', () => {
    it('should return allowed=true when user has any required role (requireAll=false)', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateRoles(['ADMIN', 'MANAGER'], false);

      expect(result.allowed).toBe(true);
    });

    it('should return allowed=false when user has none of the required roles (requireAll=false)', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      const result = permissionValidator.validateRoles(['ADMIN', 'MANAGER'], false);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing any of required roles: ADMIN, MANAGER');
    });

    it('should return allowed=false when user lacks some required roles (requireAll=true)', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateRoles(['ADMIN', 'MANAGER'], true);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing required roles: ADMIN');
    });

    it('should return allowed=true when user has all required roles (requireAll=true)', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));

      const result = permissionValidator.validateRoles(['MANAGER'], true);

      expect(result.allowed).toBe(true);
    });

    it('should throw error when throwOnFailure is true', () => {
      mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.user }));

      expect(() => {
        permissionValidator.validateRoles(['ADMIN', 'MANAGER'], false, { throwOnFailure: true });
      }).toThrow('Missing any of required roles: ADMIN, MANAGER');
    });
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    mockUseAuthStore.getState = vi.fn(() => ({ user: mockUsers.manager }));
  });

  it('should export validatePermission function', () => {
    const result = validatePermission('EMPLOYEE_READ');
    expect(result.allowed).toBe(true);
  });

  it('should export validateAnyPermission function', () => {
    const result = validateAnyPermission(['EMPLOYEE_READ', 'EMPLOYEE_DELETE']);
    expect(result.allowed).toBe(true);
  });

  it('should export validateAllPermissions function', () => {
    const result = validateAllPermissions(['EMPLOYEE_READ', 'EMPLOYEE_CREATE']);
    expect(result.allowed).toBe(true);
  });

  it('should export validateCrudOperation function', () => {
    const result = validateCrudOperation('employee', 'read');
    expect(result.allowed).toBe(true);
  });

  it('should export validateRole function', () => {
    const result = validateRole('MANAGER');
    expect(result.allowed).toBe(true);
  });

  it('should export validateRoles function', () => {
    const result = validateRoles(['ADMIN', 'MANAGER'], false);
    expect(result.allowed).toBe(true);
  });
});

describe('error classes', () => {
  it('should create PermissionError correctly', () => {
    const error = new PermissionError(
      'Access denied',
      ['EMPLOYEE_READ'],
      ['USER_READ']
    );

    expect(error.name).toBe('PermissionError');
    expect(error.message).toBe('Access denied');
    expect(error.requiredPermissions).toEqual(['EMPLOYEE_READ']);
    expect(error.userPermissions).toEqual(['USER_READ']);
  });

  it('should create RoleError correctly', () => {
    const error = new RoleError(
      'Role required',
      ['ADMIN'],
      ['USER']
    );

    expect(error.name).toBe('RoleError');
    expect(error.message).toBe('Role required');
    expect(error.requiredRoles).toEqual(['ADMIN']);
    expect(error.userRoles).toEqual(['USER']);
  });
});