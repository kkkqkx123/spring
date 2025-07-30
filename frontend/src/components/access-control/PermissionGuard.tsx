import React from 'react';
import { useAccessControl, type AccessControlOptions } from '../../hooks/useAccessControl';

export interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  options?: AccessControlOptions;
}

/**
 * Component that conditionally renders children based on user permissions/roles
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  options = {},
}) => {
  const accessControl = useAccessControl();

  // Combine single and array requirements
  const allPermissions = [
    ...(permission ? [permission] : []),
    ...permissions,
  ];
  const allRoles = [
    ...(role ? [role] : []),
    ...roles,
  ];

  // Check permissions
  const hasRequiredPermissions = (() => {
    if (allPermissions.length === 0) return true;

    if (requireAll) {
      return accessControl.hasAllPermissions(allPermissions, options);
    } else {
      return accessControl.hasAnyPermission(allPermissions, options);
    }
  })();

  // Check roles
  const hasRequiredRoles = (() => {
    if (allRoles.length === 0) return true;

    if (requireAll) {
      return accessControl.hasAllRoles(allRoles, options);
    } else {
      return accessControl.hasAnyRole(allRoles, options);
    }
  })();

  // Render children if all requirements are met
  if (hasRequiredPermissions && hasRequiredRoles) {
    return <>{children}</>;
  }

  // Render fallback if provided
  return <>{fallback}</>;
};

export default PermissionGuard;