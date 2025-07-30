// Permissions feature public API
export { PermissionManagement } from './components/PermissionManagement';
export { RolePermissionMatrix } from './components/RolePermissionMatrix';
export { UserRoleAssignment } from './components/UserRoleAssignment';
export { CustomRoleCreation } from './components/CustomRoleCreation';
export { RoleForm } from './components/RoleForm';
export { PermissionImpactDialog } from './components/PermissionImpactDialog';

// Hooks
export {
  useRoles,
  useAllRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAllPermissions,
  useUserRoles,
  useAssignUserRoles,
  useRemoveUserRole,
  usePermissionImpactAnalysis,
  useRolePermissionMatrix,
  useUpdateRolePermissions,
  useUsersWithRoles,
  useBulkAssignRoles,
  useBulkRemoveRoles,
} from './hooks/usePermissions';

// Services
export { permissionApi } from './services/permissionApi';
export type {
  RoleCreateRequest,
  RoleUpdateRequest,
  UserRoleAssignment as UserRoleAssignmentRequest,
  PermissionImpactAnalysis,
} from './services/permissionApi';
