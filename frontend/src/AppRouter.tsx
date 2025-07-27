import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ROUTES } from './constants';

// Placeholder components - these will be implemented in later tasks
const LoginPage = () => <div>Login Page - To be implemented</div>;
const RegisterPage = () => <div>Register Page - To be implemented</div>;
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

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, hasPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <div>Access Denied - Insufficient Role</div>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <div>Access Denied - Insufficient Permission</div>;
  }

  return <>{children}</>;
};

// Public Route component (redirect to dashboard if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
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

      {/* Protected routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.EMPLOYEES}
        element={
          <ProtectedRoute requiredPermission="EMPLOYEE_READ">
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DEPARTMENTS}
        element={
          <ProtectedRoute requiredPermission="DEPARTMENT_READ">
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CHAT}
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.EMAIL}
        element={
          <ProtectedRoute requiredPermission="EMAIL_SEND">
            <EmailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PERMISSIONS}
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <PermissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* 404 page */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
};
