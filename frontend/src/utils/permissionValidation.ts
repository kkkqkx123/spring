import { useAuthStore } from '../stores/authStore';
import type { User, Role, Permission } from '../types';

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

export interface ValidationOptions {
  strict?: boolean; // If true, admin role doesn't bypass permission checks
  throwOnFailure?: boolean; // If true, throws error instead of returning result
}

/**
 * Utility class for permission validation
 */
export class PermissionValidator {
  private static instance: PermissionValidator;
  
  private constructor() {}
  
  public static getInstance(): PermissionValidator {
    if (!PermissionValidator.instance) {
      PermissionValidator.instance = new PermissionValidator();
    }
    return PermissionValidator.instance;
  }

  /**
   * Get current user from auth store
   */
  private getCurrentUser(): User | null {
    return useAuthStore.getState().user;
  }

  /**
   * Get all user permissions
   */
  private getUserPermissions(user: User): string[] {
    const permissions: string[] = [];
    user.roles.forEach((role: Role) => {
      role.permissions.forEach((permission: Permission) => {
        if (!permissions.includes(permission.name)) {
          permissions.push(permission.name);
        }
      });
    });
    return permissions;
  }

  /**
   * Get all user roles
   */
  private getUserRoles(user: User): string[] {
    return user.roles.map((role: Role) => role.name);
  }

  /**
   * Check if user has specific permission
   */
  public validatePermission(
    permission: string,
    options: ValidationOptions = {}
  ): ValidationResult {
    const { strict = false, throwOnFailure = false } = options;
    const user = this.getCurrentUser();

    if (!user) {
      const result: ValidationResult = {
        allowed: false,
        reason: 'User not authenticated',
        requiredPermissions: [permission],
        userPermissions: [],
      };

      if (throwOnFailure) {
        throw new Error(result.reason);
      }
      return result;
    }

    const userRoles = this.getUserRoles(user);
    const userPermissions = this.getUserPermissions(user);

    // Check if user is admin (unless strict mode is enabled)
    if (!strict && userRoles.includes('ADMIN')) {
      return { allowed: true };
    }

    // Check if user has the required permission
    const hasPermission = userPermissions.includes(permission);

    const result: ValidationResult = {
      allowed: hasPermission,
      reason: hasPermission ? undefined : `Missing required permission: ${permission}`,
      requiredPermissions: [permission],
      userPermissions,
    };

    if (!hasPermission && throwOnFailure) {
      throw new Error(result.reason);
    }

    return result;
  }

  /**
   * Check if user has any of the specified permissions
   */
  public validateAnyPermission(
    permissions: string[],
    options: ValidationOptions = {}
  ): ValidationResult {
    const { strict = false, throwOnFailure = false } = options;
    const user = this.getCurrentUser();

    if (!user) {
      const result: ValidationResult = {
        allowed: false,
        reason: 'User not authenticated',
        requiredPermissions: permissions,
        userPermissions: [],
      };

      if (throwOnFailure) {
        throw new Error(result.reason);
      }
      return result;
    }

    const userRoles = this.getUserRoles(user);
    const userPermissions = this.getUserPermissions(user);

    // Check if user is admin (unless strict mode is enabled)
    if (!strict && userRoles.includes('ADMIN')) {
      return { allowed: true };
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    const result: ValidationResult = {
      allowed: hasAnyPermission,
      reason: hasAnyPermission
        ? undefined
        : `Missing any of required permissions: ${permissions.join(', ')}`,
      requiredPermissions: permissions,
      userPermissions,
    };

    if (!hasAnyPermission && throwOnFailure) {
      throw new Error(result.reason);
    }

    return result;
  }

  /**
   * Check if user has all of the specified permissions
   */
  public validateAllPermissions(
    permissions: string[],
    options: ValidationOptions = {}
  ): ValidationResult {
    const { strict = false, throwOnFailure = false } = options;
    const user = this.getCurrentUser();

    if (!user) {
      const result: ValidationResult = {
        allowed: false,
        reason: 'User not authenticated',
        requiredPermissions: permissions,
        userPermissions: [],
      };

      if (throwOnFailure) {
        throw new Error(result.reason);
      }
      return result;
    }

    const userRoles = this.getUserRoles(user);
    const userPermissions = this.getUserPermissions(user);

    // Check if user is admin (unless strict mode is enabled)
    if (!strict && userRoles.includes('ADMIN')) {
      return { allowed: true };
    }

    // Check if user has all required permissions
    const missingPermissions = permissions.filter(permission =>
      !userPermissions.includes(permission)
    );
    const hasAllPermissions = missingPermissions.length === 0;

    const result: ValidationResult = {
      allowed: hasAllPermissions,
      reason: hasAllPermissions
        ? undefined
        : `Missing required permissions: ${missingPermissions.join(', ')}`,
      requiredPermissions: permissions,
      userPermissions,
    };

    if (!hasAllPermissions && throwOnFailure) {
      throw new Error(result.reason);
    }

    return result;
  }

  /**
   * Validate CRUD operation permission
   */
  public validateCrudOperation(
    resource: string,
    operation: 'create' | 'read' | 'update' | 'delete',
    options: ValidationOptions = {}
  ): ValidationResult {
    const permission = `${resource.toUpperCase()}_${operation.toUpperCase()}`;
    return this.validatePermission(permission, options);
  }

  /**
   * Validate role-based access
   */
  public validateRole(
    role: string,
    options: ValidationOptions = {}
  ): ValidationResult {
    const { throwOnFailure = false } = options;
    const user = this.getCurrentUser();

    if (!user) {
      const result: ValidationResult = {
        allowed: false,
        reason: 'User not authenticated',
      };

      if (throwOnFailure) {
        throw new Error(result.reason);
      }
      return result;
    }

    const userRoles = this.getUserRoles(user);
    const hasRole = userRoles.includes(role);

    const result: ValidationResult = {
      allowed: hasRole,
      reason: hasRole ? undefined : `Missing required role: ${role}`,
    };

    if (!hasRole && throwOnFailure) {
      throw new Error(result.reason);
    }

    return result;
  }

  /**
   * Validate multiple roles (any or all)
   */
  public validateRoles(
    roles: string[],
    requireAll: boolean = false,
    options: ValidationOptions = {}
  ): ValidationResult {
    const { throwOnFailure = false } = options;
    const user = this.getCurrentUser();

    if (!user) {
      const result: ValidationResult = {
        allowed: false,
        reason: 'User not authenticated',
      };

      if (throwOnFailure) {
        throw new Error(result.reason);
      }
      return result;
    }

    const userRoles = this.getUserRoles(user);
    
    let hasRequiredRoles: boolean;
    let reason: string | undefined;

    if (requireAll) {
      const missingRoles = roles.filter(role => !userRoles.includes(role));
      hasRequiredRoles = missingRoles.length === 0;
      reason = hasRequiredRoles
        ? undefined
        : `Missing required roles: ${missingRoles.join(', ')}`;
    } else {
      hasRequiredRoles = roles.some(role => userRoles.includes(role));
      reason = hasRequiredRoles
        ? undefined
        : `Missing any of required roles: ${roles.join(', ')}`;
    }

    const result: ValidationResult = {
      allowed: hasRequiredRoles,
      reason,
    };

    if (!hasRequiredRoles && throwOnFailure) {
      throw new Error(result.reason);
    }

    return result;
  }
}

// Export singleton instance
export const permissionValidator = PermissionValidator.getInstance();

// Convenience functions
export const validatePermission = (
  permission: string,
  options?: ValidationOptions
) => permissionValidator.validatePermission(permission, options);

export const validateAnyPermission = (
  permissions: string[],
  options?: ValidationOptions
) => permissionValidator.validateAnyPermission(permissions, options);

export const validateAllPermissions = (
  permissions: string[],
  options?: ValidationOptions
) => permissionValidator.validateAllPermissions(permissions, options);

export const validateCrudOperation = (
  resource: string,
  operation: 'create' | 'read' | 'update' | 'delete',
  options?: ValidationOptions
) => permissionValidator.validateCrudOperation(resource, operation, options);

export const validateRole = (
  role: string,
  options?: ValidationOptions
) => permissionValidator.validateRole(role, options);

export const validateRoles = (
  roles: string[],
  requireAll?: boolean,
  options?: ValidationOptions
) => permissionValidator.validateRoles(roles, requireAll, options);

// Error classes for permission validation
export class PermissionError extends Error {
  constructor(
    message: string,
    public requiredPermissions?: string[],
    public userPermissions?: string[]
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class RoleError extends Error {
  constructor(
    message: string,
    public requiredRoles?: string[],
    public userRoles?: string[]
  ) {
    super(message);
    this.name = 'RoleError';
  }
}