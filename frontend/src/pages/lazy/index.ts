import { lazyImport, lazyWithRetry, preloadComponent } from '../../utils/lazyImport';

// Lazy load feature pages with retry functionality
export const DashboardPage = lazyWithRetry(() => import('../DashboardPage'));
export const EmployeesPage = lazyWithRetry(() => import('../../features/employees/pages/EmployeesPage'));
export const EmployeePage = lazyWithRetry(() => import('../../features/employees/pages/EmployeePage'));
export const DepartmentsPage = lazyWithRetry(() => import('../../features/departments/pages/DepartmentsPage'));
export const ChatPage = lazyWithRetry(() => import('../../features/chat/pages/ChatPage'));
export const EmailPage = lazyWithRetry(() => import('../../features/email/pages/EmailPage'));
export const NotificationsPage = lazyWithRetry(() => import('../../features/notifications/pages/NotificationsPage'));
export const PermissionsPage = lazyWithRetry(() => import('../../features/permissions/pages/PermissionsPage'));
export const ProfilePage = lazyWithRetry(() => import('../ProfilePage'));

// Preload critical pages that are likely to be accessed soon
export const preloadCriticalPages = () => {
  // Preload dashboard as it's the default route
  preloadComponent(() => import('../DashboardPage'));
  
  // Preload employees page as it's commonly accessed
  preloadComponent(() => import('../../features/employees/pages/EmployeesPage'));
};

// Preload pages based on user role
export const preloadRoleBasedPages = (userRoles: string[]) => {
  if (userRoles.includes('ADMIN') || userRoles.includes('HR_MANAGER')) {
    preloadComponent(() => import('../../features/employees/pages/EmployeesPage'));
    preloadComponent(() => import('../../features/departments/pages/DepartmentsPage'));
    preloadComponent(() => import('../../features/permissions/pages/PermissionsPage'));
  }
  
  if (userRoles.includes('ADMIN')) {
    preloadComponent(() => import('../../features/permissions/pages/PermissionsPage'));
  }
  
  // All users can access chat and notifications
  preloadComponent(() => import('../../features/chat/pages/ChatPage'));
  preloadComponent(() => import('../../features/notifications/pages/NotificationsPage'));
};