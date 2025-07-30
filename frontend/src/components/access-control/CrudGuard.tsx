import React from 'react';
import { useAccessControl, type AccessControlOptions } from '../../hooks/useAccessControl';

export interface CrudGuardProps {
  children: React.ReactNode;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'any';
  fallback?: React.ReactNode;
  options?: AccessControlOptions;
}

/**
 * Component that conditionally renders children based on CRUD permissions for a resource
 */
export const CrudGuard: React.FC<CrudGuardProps> = ({
  children,
  resource,
  action,
  fallback = null,
  options = {},
}) => {
  const { canCreate, canRead, canUpdate, canDelete, canAccessResource } = useAccessControl();

  // Check permission based on action
  const hasPermission = (() => {
    switch (action) {
      case 'create':
        return canCreate(resource, options);
      case 'read':
        return canRead(resource, options);
      case 'update':
        return canUpdate(resource, options);
      case 'delete':
        return canDelete(resource, options);
      case 'any':
        return canAccessResource(resource, options);
      default:
        return false;
    }
  })();

  // Render children if permission is granted
  if (hasPermission) {
    return <>{children}</>;
  }

  // Render fallback if provided
  return <>{fallback}</>;
};

export default CrudGuard;