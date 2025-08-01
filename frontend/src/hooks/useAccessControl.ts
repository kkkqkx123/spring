import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Role, Permission } from '../types';

export interface AccessControlOptions {
  fallbackValue?: boolean;
  strict?: boolean; // If true, requires exact permission match
}

// Enhanced permission checking hook
export const useAccessControl = () => {
  const auth = useAuth();

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission: string, options: AccessControlOptions = {}) => {
      const { fallbackValue = false, strict = false } = options;

      if (!auth.isAuthenticated || !auth.user) {
        return fallbackValue;
      }

      if (strict) {
        return auth.hasPermission(permission);
      }

      // For non-strict mode, also check for admin role
      return auth.hasRole('ADMIN') || auth.hasPermission(permission);
    },
    [auth]
  );

  // Check if user has specific role
  const hasRole = useCallback(
    (role: string, options: AccessControlOptions = {}) => {
      const { fallbackValue = false } = options;

      if (!auth.isAuthenticated || !auth.user) {
        return fallbackValue;
      }

      return auth.hasRole(role);
    },
    [auth]
  );

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback(
    (permissions: string[], options: AccessControlOptions = {}) => {
      const { fallbackValue = false, strict = false } = options;

      if (!auth.isAuthenticated || !auth.user) {
        return fallbackValue;
      }

      if (strict) {
        return auth.hasAnyPermission(permissions);
      }

      // For non-strict mode, also check for admin role
      return auth.hasRole('ADMIN') || auth.hasAnyPermission(permissions);
    },
    [auth]
  );

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback(
    (permissions: string[], options: AccessControlOptions = {}) => {
      const { fallbackValue = false, strict = false } = options;

      if (!auth.isAuthenticated || !auth.user) {
        return fallbackValue;
      }

      if (strict) {
        return auth.hasAllPermissions(permissions);
      }

      // For non-strict mode, admin role grants all permissions
      return auth.hasRole('ADMIN') || auth.hasAllPermissions(permissions);
    },
    [auth]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roles: string[], options: AccessControlOptions = {}) => {
      const { fallbackValue = false } = options;

      if (!auth.isAuthenticated || !auth.user) {
        return fallbackValue;
      }

      return auth.hasAnyRole(roles);
    },
    [auth]
  );

  // Check if user has all of the specified roles
  const hasAllRoles = useCallback(
    (roles: string[], options: AccessControlOptions = {}) => {
      const { fallbackValue = false } = options;

      if (!auth.isAuthenticated || !auth.user) {
        return fallbackValue;
      }

      return auth.hasAllRoles(roles);
    },
    [auth]
  );

  // Check if user can perform CRUD operations
  const canCreate = useCallback(
    (resource: string, options: AccessControlOptions = {}) => {
      return hasPermission(`${resource.toUpperCase()}_CREATE`, options);
    },
    [hasPermission]
  );

  const canRead = useCallback(
    (resource: string, options: AccessControlOptions = {}) => {
      return hasPermission(`${resource.toUpperCase()}_READ`, options);
    },
    [hasPermission]
  );

  const canUpdate = useCallback(
    (resource: string, options: AccessControlOptions = {}) => {
      return hasPermission(`${resource.toUpperCase()}_UPDATE`, options);
    },
    [hasPermission]
  );

  const canDelete = useCallback(
    (resource: string, options: AccessControlOptions = {}) => {
      return hasPermission(`${resource.toUpperCase()}_DELETE`, options);
    },
    [hasPermission]
  );

  // Check if user can perform any CRUD operation on a resource
  const canAccessResource = useCallback(
    (resource: string, options: AccessControlOptions = {}) => {
      const resourceUpper = resource.toUpperCase();
      return hasAnyPermission(
        [
          `${resourceUpper}_CREATE`,
          `${resourceUpper}_READ`,
          `${resourceUpper}_UPDATE`,
          `${resourceUpper}_DELETE`,
        ],
        options
      );
    },
    [hasAnyPermission]
  );

  // Get user's permissions for a specific resource
  const getResourcePermissions = useCallback(
    (resource: string) => {
      return {
        create: canCreate(resource),
        read: canRead(resource),
        update: canUpdate(resource),
        delete: canDelete(resource),
      };
    },
    [canCreate, canRead, canUpdate, canDelete]
  );

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return hasRole('ADMIN');
  }, [hasRole]);

  // Check if user is manager
  const isManager = useMemo(() => {
    return hasAnyRole(['ADMIN', 'MANAGER']);
  }, [hasAnyRole]);

  // Get all user permissions
  const userPermissions = useMemo(() => {
    if (!auth.user) return [];

    const permissions: string[] = [];
    auth.user.roles.forEach((role: Role) => {
      role.permissions.forEach((permission: Permission) => {
        if (!permissions.includes(permission.name)) {
          permissions.push(permission.name);
        }
      });
    });

    return permissions;
  }, [auth.user]);

  // Get all user roles
  const userRoles = useMemo(() => {
    if (!auth.user) return [];
    return auth.user.roles.map((role: Role) => role.name);
  }, [auth.user]);

  return {
    // Basic checks
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,

    // CRUD operations
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canAccessResource,
    getResourcePermissions,

    // Convenience checks
    isAdmin,
    isManager,

    // User data
    userPermissions,
    userRoles,

    // Auth state
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
  };
};

// Hook for checking specific permission with reactive updates
export const usePermissionCheck = (
  permission: string,
  options: AccessControlOptions = {}
) => {
  const { hasPermission } = useAccessControl();
  return hasPermission(permission, options);
};

// Hook for checking specific role with reactive updates
export const useRoleCheck = (
  role: string,
  options: AccessControlOptions = {}
) => {
  const { hasRole } = useAccessControl();
  return hasRole(role, options);
};

// Hook for checking CRUD permissions on a resource
export const useResourcePermissions = (resource: string) => {
  const { getResourcePermissions } = useAccessControl();
  return getResourcePermissions(resource);
};

// Hook for checking if user can access a feature
export const useFeatureAccess = (feature: string) => {
  const { canAccessResource } = useAccessControl();
  return canAccessResource(feature);
};
