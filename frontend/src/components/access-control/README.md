# Access Control System

This directory contains a comprehensive role-based access control (RBAC) system for React applications. The system provides multiple ways to implement permission and role-based UI rendering and functionality.

## Features

- **Permission-based rendering**: Show/hide UI elements based on user permissions
- **Role-based rendering**: Show/hide UI elements based on user roles
- **CRUD operation guards**: Simplified permission checks for Create, Read, Update, Delete operations
- **Route protection**: Protect routes based on permissions and roles
- **Programmatic validation**: Validate permissions in business logic
- **Higher-order components**: Wrap components with permission checks
- **React hooks**: Use permissions in functional components
- **TypeScript support**: Full type safety throughout

## Components

### PermissionGuard

Conditionally renders children based on user permissions.

```tsx
import { PermissionGuard } from '@/components/access-control';

// Single permission
<PermissionGuard permission="EMPLOYEE_READ">
  <Button>View Employees</Button>
</PermissionGuard>

// Multiple permissions (any)
<PermissionGuard permissions={['EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE']} requireAll={false}>
  <Button>Modify Employees</Button>
</PermissionGuard>

// Multiple permissions (all required)
<PermissionGuard
  permissions={['EMPLOYEE_READ', 'EMPLOYEE_UPDATE']}
  requireAll={true}
  fallback={<Text>Insufficient permissions</Text>}
>
  <Button>Edit Employee</Button>
</PermissionGuard>

// With options
<PermissionGuard
  permission="EMPLOYEE_DELETE"
  options={{ strict: true, fallbackValue: false }}
>
  <Button>Delete Employee</Button>
</PermissionGuard>
```

### RoleGuard

Conditionally renders children based on user roles.

```tsx
import { RoleGuard } from '@/components/access-control';

// Single role
<RoleGuard role="ADMIN">
  <Button>Admin Panel</Button>
</RoleGuard>

// Multiple roles
<RoleGuard roles={['ADMIN', 'MANAGER']} requireAll={false}>
  <Button>Management Functions</Button>
</RoleGuard>
```

### CrudGuard

Simplified permission checks for CRUD operations.

```tsx
import { CrudGuard } from '@/components/access-control';

<CrudGuard resource="employee" action="create">
  <Button>Create Employee</Button>
</CrudGuard>

<CrudGuard resource="employee" action="read">
  <Button>View Employees</Button>
</CrudGuard>

<CrudGuard resource="employee" action="update">
  <Button>Edit Employee</Button>
</CrudGuard>

<CrudGuard resource="employee" action="delete">
  <Button>Delete Employee</Button>
</CrudGuard>

<CrudGuard resource="employee" action="any">
  <Button>Any Employee Action</Button>
</CrudGuard>
```

### AdminGuard

Specialized component for admin-only content.

```tsx
import { AdminGuard } from '@/components/access-control';

<AdminGuard>
  <Button>Super Admin Function</Button>
</AdminGuard>

<AdminGuard fallback={<Text>Admin access required</Text>}>
  <AdminPanel />
</AdminGuard>
```

## Higher-Order Components (HOCs)

### withPermission

Wraps components with permission checking logic.

```tsx
import { withPermission } from '@/components/access-control';

const ProtectedComponent = withPermission(MyComponent, {
  permission: 'EMPLOYEE_READ',
  showFallback: true,
});

// Multiple permissions
const MultiPermissionComponent = withPermission(MyComponent, {
  permissions: ['EMPLOYEE_READ', 'EMPLOYEE_WRITE'],
  requireAll: false,
});

// Combined permissions and roles
const CombinedComponent = withPermission(MyComponent, {
  permission: 'EMPLOYEE_READ',
  role: 'MANAGER',
  fallback: CustomFallbackComponent,
});
```

### Specialized HOCs

```tsx
import {
  withAdminPermission,
  withManagerPermission,
  withCrudPermission,
} from '@/components/access-control';

// Admin only
const AdminComponent = withAdminPermission(MyComponent);

// Manager or Admin
const ManagerComponent = withManagerPermission(MyComponent);

// CRUD permission
const CreateEmployeeComponent = withCrudPermission(
  MyComponent,
  'employee',
  'create'
);
```

## React Hooks

### useAccessControl

Main hook providing comprehensive access control functionality.

```tsx
import { useAccessControl } from '@/hooks/useAccessControl';

const MyComponent = () => {
  const {
    // Basic checks
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,

    // CRUD operations
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canAccessResource,
    getResourcePermissions,

    // Convenience checks
    isAdmin,
    isManager,

    // User data
    userPermissions,
    userRoles,
    user,
    isAuthenticated,
  } = useAccessControl();

  return (
    <div>
      {hasPermission('EMPLOYEE_READ') && <Button>View Employees</Button>}
      {hasRole('ADMIN') && <Button>Admin Panel</Button>}
      {canCreate('employee') && <Button>Create Employee</Button>}
      {isAdmin && <Button>Super Admin</Button>}
    </div>
  );
};
```

### Specialized Hooks

```tsx
import {
  usePermissionCheck,
  useRoleCheck,
  useResourcePermissions,
  useFeatureAccess,
} from '@/hooks/useAccessControl';

const MyComponent = () => {
  const canReadEmployees = usePermissionCheck('EMPLOYEE_READ');
  const isManager = useRoleCheck('MANAGER');
  const employeePerms = useResourcePermissions('employee');
  const hasEmployeeAccess = useFeatureAccess('employee');

  return (
    <div>
      {canReadEmployees && <EmployeeList />}
      {isManager && <ManagerDashboard />}
      {employeePerms.create && <CreateEmployeeButton />}
      {hasEmployeeAccess && <EmployeeModule />}
    </div>
  );
};
```

## Route Protection

Enhanced ProtectedRoute component with access control integration.

```tsx
import { ProtectedRoute } from '@/components/routing';

// Basic authentication
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Permission-based
<ProtectedRoute requiredPermission="EMPLOYEE_READ">
  <EmployeesPage />
</ProtectedRoute>

// Role-based
<ProtectedRoute requiredRole="ADMIN">
  <AdminPanel />
</ProtectedRoute>

// Multiple requirements
<ProtectedRoute
  requiredPermissions={['EMPLOYEE_READ', 'EMPLOYEE_WRITE']}
  requireAll={false}
  accessControlOptions={{ strict: true }}
>
  <EmployeeManagement />
</ProtectedRoute>

// Custom redirect
<ProtectedRoute
  requiredRole="ADMIN"
  redirectTo="/access-denied"
  fallback={<AccessDeniedPage />}
>
  <SuperAdminPanel />
</ProtectedRoute>
```

## Programmatic Validation

For business logic and complex validation scenarios.

```tsx
import {
  validatePermission,
  validateCrudOperation,
  validateRole,
  permissionValidator,
} from '@/utils/permissionValidation';

// Simple validation
const handleDeleteEmployee = (employeeId: number) => {
  const result = validateCrudOperation('employee', 'delete');

  if (!result.allowed) {
    alert(result.reason);
    return;
  }

  // Proceed with deletion
  deleteEmployee(employeeId);
};

// With error throwing
const handleAdminAction = () => {
  try {
    validateRole('ADMIN', { throwOnFailure: true });
    // Proceed with admin action
  } catch (error) {
    console.error('Access denied:', error.message);
  }
};

// Complex validation
const handleComplexOperation = () => {
  const permissionResult = validatePermission('EMPLOYEE_UPDATE');
  const roleResult = validateRole('MANAGER');

  if (permissionResult.allowed && roleResult.allowed) {
    // Proceed with operation
  } else {
    console.log('Missing permissions:', permissionResult.requiredPermissions);
    console.log('User permissions:', permissionResult.userPermissions);
  }
};
```

## Configuration Options

### AccessControlOptions

```tsx
interface AccessControlOptions {
  fallbackValue?: boolean; // Default return value when not authenticated
  strict?: boolean; // If true, admin role doesn't bypass permission checks
}
```

### Usage Examples

```tsx
// Non-strict mode (default) - admin bypasses permission checks
const canDelete = hasPermission('EMPLOYEE_DELETE'); // true for admin

// Strict mode - admin must have explicit permission
const canDelete = hasPermission('EMPLOYEE_DELETE', { strict: true }); // false if admin lacks permission

// Fallback value for unauthenticated users
const canView = hasPermission('EMPLOYEE_READ', { fallbackValue: true }); // true for guests
```

## Permission Naming Convention

The system uses a consistent naming convention for permissions:

- **Format**: `{RESOURCE}_{ACTION}`
- **Examples**:
  - `EMPLOYEE_READ`
  - `EMPLOYEE_CREATE`
  - `EMPLOYEE_UPDATE`
  - `EMPLOYEE_DELETE`
  - `DEPARTMENT_READ`
  - `PAYROLL_PROCESS`

## Role Hierarchy

The system recognizes the following role hierarchy:

1. **ADMIN** - Full system access (bypasses permission checks in non-strict mode)
2. **MANAGER** - Management-level access
3. **USER** - Basic user access

## Error Handling

The system provides comprehensive error handling:

```tsx
import { PermissionError, RoleError } from '@/utils/permissionValidation';

try {
  validatePermission('EMPLOYEE_DELETE', { throwOnFailure: true });
} catch (error) {
  if (error instanceof PermissionError) {
    console.log('Required permissions:', error.requiredPermissions);
    console.log('User permissions:', error.userPermissions);
  }
}
```

## Testing

The system includes comprehensive test coverage:

- **Unit tests** for all hooks and utilities
- **Component tests** for all guard components
- **Integration tests** for HOCs and complex scenarios
- **Mock utilities** for testing components with access control

```tsx
// Example test setup
import { render, screen } from '@testing-library/react';
import { useAccessControl } from '@/hooks/useAccessControl';

vi.mock('@/hooks/useAccessControl');

const mockUseAccessControl = useAccessControl as any;

beforeEach(() => {
  mockUseAccessControl.mockReturnValue({
    hasPermission: vi.fn(() => true),
    hasRole: vi.fn(() => false),
    isAdmin: false,
    // ... other mock values
  });
});
```

## Best Practices

1. **Use the most specific guard**: Prefer `CrudGuard` over `PermissionGuard` for CRUD operations
2. **Provide fallbacks**: Always provide meaningful fallback content for better UX
3. **Combine with route protection**: Use both component-level and route-level protection
4. **Test thoroughly**: Test both positive and negative permission scenarios
5. **Use TypeScript**: Leverage the full type safety provided by the system
6. **Cache permission checks**: The hooks automatically handle caching and reactivity
7. **Handle loading states**: Consider loading states while permissions are being checked
8. **Graceful degradation**: Provide appropriate fallbacks for users without permissions

## Migration Guide

If migrating from a simpler permission system:

1. Replace direct permission checks with hooks:

   ```tsx
   // Before
   if (user.permissions.includes('EMPLOYEE_READ')) { ... }

   // After
   const canRead = usePermissionCheck('EMPLOYEE_READ');
   if (canRead) { ... }
   ```

2. Replace conditional rendering with guards:

   ```tsx
   // Before
   {
     hasPermission && <Button>Action</Button>;
   }

   // After
   <PermissionGuard permission="ACTION_PERMISSION">
     <Button>Action</Button>
   </PermissionGuard>;
   ```

3. Update route protection:

   ```tsx
   // Before
   <Route path="/admin" element={user.isAdmin ? <AdminPanel /> : <Redirect />} />

   // After
   <Route path="/admin" element={
     <ProtectedRoute requiredRole="ADMIN">
       <AdminPanel />
     </ProtectedRoute>
   } />
   ```

## Performance Considerations

- **Memoization**: All hooks use proper memoization to prevent unnecessary re-renders
- **Selective subscriptions**: Use specific permission checks rather than subscribing to all user data
- **Lazy evaluation**: Permission checks are only performed when needed
- **Caching**: Permission results are cached and invalidated appropriately

## Security Notes

- **Client-side only**: This system is for UI/UX purposes only - always validate permissions on the server
- **Token security**: Ensure JWT tokens are stored securely and refreshed appropriately
- **Audit logging**: Consider logging permission checks for security auditing
- **Regular updates**: Keep permission definitions synchronized with backend changes
