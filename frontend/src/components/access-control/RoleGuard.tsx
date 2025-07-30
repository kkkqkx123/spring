import React from 'react';
import { useAccessControl, type AccessControlOptions } from '../../hooks/useAccessControl';

export interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  options?: AccessControlOptions;
}

/**
 * Component that conditionally renders children based on user roles
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  options = {},
}) => {
  const { hasRole, hasAnyRole, hasAllRoles } = useAccessControl();

  // Combine single and array requirements
  const allRoles = [
    ...(role ? [role] : []),
    ...roles,
  ];

  // Check roles
  const hasRequiredRoles = (() => {
    if (allRoles.length === 0) return true;

    if (requireAll) {
      return hasAllRoles(allRoles, options);
    } else {
      return hasAnyRole(allRoles, options);
    }
  })();

  // Render children if requirements are met
  if (hasRequiredRoles) {
    return <>{children}</>;
  }

  // Render fallback if provided
  return <>{fallback}</>;
};

export default RoleGuard;