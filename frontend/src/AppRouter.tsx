import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { Center, Loader } from '@mantine/core';
import { ROUTES } from './constants';
import { ProtectedRoute, PublicRoute } from './components/routing';
import { LoginPage, RegisterPage } from './features/auth/pages';
import { AppShell } from './components/layout';
import { LazyComponentWrapper } from './components/ui/LazyComponentWrapper';
import { useAuth } from './hooks/useAuth';

// Lazy-loaded page components
import {
  DashboardPage,
  EmployeesPage,
  EmployeePage,
  DepartmentsPage,
  ChatPage,
  EmailPage,
  NotificationsPage,
  PermissionsPage,
  ProfilePage,
  preloadCriticalPages,
  preloadRoleBasedPages,
} from './pages/lazy';

// Loading fallback component
const LoadingFallback = () => (
  <Center h="100vh">
    <Loader size="lg" />
  </Center>
);

export const AppRouter = () => {
  const { user, isAuthenticated } = useAuth();

  // Preload critical pages and role-based pages
  useEffect(() => {
    if (isAuthenticated) {
      preloadCriticalPages();
      
      if (user?.roles) {
        const roleNames = user.roles.map(role => role.name);
        preloadRoleBasedPages(roleNames);
      }
    }
  }, [isAuthenticated, user?.roles]);

  return (
    <Routes>
      {/* Public routes - no layout */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes - with layout and lazy loading */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyComponentWrapper skeletonVariant="page">
                <DashboardPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.EMPLOYEES}
        element={
          <ProtectedRoute requiredPermission="EMPLOYEE_READ">
            <AppShell>
              <LazyComponentWrapper skeletonVariant="table">
                <EmployeesPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <ProtectedRoute requiredPermission="EMPLOYEE_READ">
            <AppShell>
              <LazyComponentWrapper skeletonVariant="form">
                <EmployeePage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/new"
        element={
          <ProtectedRoute requiredPermission="EMPLOYEE_CREATE">
            <AppShell>
              <LazyComponentWrapper skeletonVariant="form">
                <EmployeePage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DEPARTMENTS}
        element={
          <ProtectedRoute requiredPermission="DEPARTMENT_READ">
            <AppShell>
              <LazyComponentWrapper skeletonVariant="page">
                <DepartmentsPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CHAT}
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyComponentWrapper skeletonVariant="page">
                <ChatPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.EMAIL}
        element={
          <ProtectedRoute requiredPermission="EMAIL_SEND">
            <AppShell>
              <LazyComponentWrapper skeletonVariant="form">
                <EmailPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyComponentWrapper skeletonVariant="list">
                <NotificationsPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PERMISSIONS}
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppShell>
              <LazyComponentWrapper skeletonVariant="table">
                <PermissionsPage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyComponentWrapper skeletonVariant="form">
                <ProfilePage />
              </LazyComponentWrapper>
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* 404 page */}
      <Route
        path="*"
        element={
          <Center h="100vh">
            <div>404 - Page Not Found</div>
          </Center>
        }
      />
    </Routes>
  );
};
