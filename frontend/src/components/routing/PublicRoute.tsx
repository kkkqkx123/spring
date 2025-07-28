import React from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';

export interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = ROUTES.DASHBOARD,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" data-testid="loading-spinner" />
      </Center>
    );
  }

  // Redirect authenticated users to dashboard or specified route
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children for unauthenticated users
  return <>{children}</>;
};

export default PublicRoute;