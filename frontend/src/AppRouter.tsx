import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { Center, Loader } from '@mantine/core';
import { ROUTES } from './constants';
import { ProtectedRoute, PublicRoute } from './components/routing';
import { LoginPage, RegisterPage } from './features/auth/pages';
import { AppShell } from './components/layout';

// Placeholder components - these will be implemented in later tasks
const DashboardPage = () => <div>Dashboard Page - To be implemented</div>;
const EmployeesPage = () => <div>Employees Page - To be implemented</div>;
const DepartmentsPage = () => <div>Departments Page - To be implemented</div>;
const ChatPage = () => <div>Chat Page - To be implemented</div>;
const EmailPage = () => <div>Email Page - To be implemented</div>;
const NotificationsPage = () => (
  <div>Notifications Page - To be implemented</div>
);
const PermissionsPage = () => <div>Permissions Page - To be implemented</div>;
const ProfilePage = () => <div>Profile Page - To be implemented</div>;

// Loading fallback component
const LoadingFallback = () => (
  <Center h="100vh">
    <Loader size="lg" />
  </Center>
);

export const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
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

        {/* Protected routes - with layout */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.EMPLOYEES}
          element={
            <ProtectedRoute requiredPermission="EMPLOYEE_READ">
              <AppShell>
                <EmployeesPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DEPARTMENTS}
          element={
            <ProtectedRoute requiredPermission="DEPARTMENT_READ">
              <AppShell>
                <DepartmentsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CHAT}
          element={
            <ProtectedRoute>
              <AppShell>
                <ChatPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.EMAIL}
          element={
            <ProtectedRoute requiredPermission="EMAIL_SEND">
              <AppShell>
                <EmailPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <AppShell>
                <NotificationsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PERMISSIONS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AppShell>
                <PermissionsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
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
    </Suspense>
  );
};
