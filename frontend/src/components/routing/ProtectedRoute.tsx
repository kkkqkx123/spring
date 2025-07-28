import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader, Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean; // For multiple roles/permissions, require all or just one
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" data-testid="loading-spinner" />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={ROUTES.LOGIN} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Combine single and array requirements
  const allRequiredRoles = [
    ...(requiredRole ? [requiredRole] : []),
    ...requiredRoles,
  ];
  const allRequiredPermissions = [
    ...(requiredPermission ? [requiredPermission] : []),
    ...requiredPermissions,
  ];

  // Check role requirements
  const hasRequiredRoles = (() => {
    if (allRequiredRoles.length === 0) return true;
    
    if (requireAll) {
      return allRequiredRoles.every(role => hasRole(role));
    } else {
      return allRequiredRoles.some(role => hasRole(role));
    }
  })();

  // Check permission requirements
  const hasRequiredPermissions = (() => {
    if (allRequiredPermissions.length === 0) return true;
    
    if (requireAll) {
      return allRequiredPermissions.every(permission => hasPermission(permission));
    } else {
      return allRequiredPermissions.some(permission => hasPermission(permission));
    }
  })();

  // Show access denied if requirements not met
  if (!hasRequiredRoles || !hasRequiredPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <IconLock size={64} color="var(--mantine-color-red-6)" />
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Access Denied"
            color="red"
            variant="light"
            maw={400}
          >
            <Stack gap="xs">
              <Text size="sm">
                You don't have the required permissions to access this page.
              </Text>
              
              {allRequiredRoles.length > 0 && (
                <Text size="xs" c="dimmed">
                  Required roles: {allRequiredRoles.join(requireAll ? ' AND ' : ' OR ')}
                </Text>
              )}
              
              {allRequiredPermissions.length > 0 && (
                <Text size="xs" c="dimmed">
                  Required permissions: {allRequiredPermissions.join(requireAll ? ' AND ' : ' OR ')}
                </Text>
              )}
              
              <Button
                variant="light"
                size="sm"
                onClick={() => window.history.back()}
                mt="xs"
              >
                Go Back
              </Button>
            </Stack>
          </Alert>
        </Stack>
      </Center>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;