import React from 'react';
import {
  useAccessControl,
  type AccessControlOptions,
} from '../../hooks/useAccessControl';
import { Alert, Text } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

export interface WithPermissionOptions<P extends object>
  extends AccessControlOptions {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ComponentType<P>;
  showFallback?: boolean;
}

/**
 * Higher-order component that wraps a component with permission checking
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionOptions<P> = {}
) {
  const {
    permission,
    permissions = [],
    role,
    roles = [],
    requireAll = false,
    fallback: FallbackComponent,
    showFallback = true,
    ...accessControlOptions
  } = options;

  const WithPermissionComponent: React.FC<P> = props => {
    const accessControl = useAccessControl();

    // Combine single and array requirements
    const allPermissions = [
      ...(permission ? [permission] : []),
      ...permissions,
    ];
    const allRoles = [...(role ? [role] : []), ...roles];

    // Check permissions
    const hasRequiredPermissions = (() => {
      if (allPermissions.length === 0) return true;

      if (requireAll) {
        return accessControl.hasAllPermissions(
          allPermissions,
          accessControlOptions
        );
      } else {
        return accessControl.hasAnyPermission(
          allPermissions,
          accessControlOptions
        );
      }
    })();

    // Check roles
    const hasRequiredRoles = (() => {
      if (allRoles.length === 0) return true;

      if (requireAll) {
        return accessControl.hasAllRoles(allRoles, accessControlOptions);
      } else {
        return accessControl.hasAnyRole(allRoles, accessControlOptions);
      }
    })();

    // Render wrapped component if all requirements are met
    if (hasRequiredPermissions && hasRequiredRoles) {
      return <WrappedComponent {...props} />;
    }

    // Render custom fallback if provided
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    // Render default fallback if enabled
    if (showFallback) {
      return (
        <Alert
          icon={<IconLock size="1rem" />}
          title="Access Denied"
          color="red"
          variant="light"
        >
          <Text size="sm">
            You don't have the required permissions to access this feature.
          </Text>

          {allRoles.length > 0 && (
            <Text size="xs" c="dimmed" mt="xs">
              Required roles: {allRoles.join(requireAll ? ' AND ' : ' OR ')}
            </Text>
          )}

          {allPermissions.length > 0 && (
            <Text size="xs" c="dimmed" mt="xs">
              Required permissions:{' '}
              {allPermissions.join(requireAll ? ' AND ' : ' OR ')}
            </Text>
          )}
        </Alert>
      );
    }

    // Return null if no fallback should be shown
    return null;
  };

  WithPermissionComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPermissionComponent;
}

/**
 * HOC specifically for admin-only components
 */
export function withAdminPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithPermissionOptions<P>, 'role'> = {}
) {
  return withPermission(WrappedComponent, {
    ...options,
    role: 'ADMIN',
  });
}

/**
 * HOC specifically for manager-level components
 */
export function withManagerPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithPermissionOptions<P>, 'roles'> = {}
) {
  return withPermission(WrappedComponent, {
    ...options,
    roles: ['ADMIN', 'MANAGER'],
    requireAll: false,
  });
}

/**
 * HOC for CRUD-specific permissions
 */
export function withCrudPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
  options: Omit<WithPermissionOptions<P>, 'permission'> = {}
) {
  const permission = `${resource.toUpperCase()}_${action.toUpperCase()}`;

  return withPermission(WrappedComponent, {
    ...options,
    permission,
  });
}
