import { apiClient } from '../../../services/api';
import type {
  Role,
  Permission,
  User,
  PaginatedResponse,
  Pageable,
} from '../../../types';

export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface RoleUpdateRequest {
  id: number;
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface UserRoleAssignment {
  userId: number;
  roleIds: number[];
}

export interface PermissionImpactAnalysis {
  affectedUsers: number;
  affectedFeatures: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
}

export const permissionApi = {
  // Role management
  getRoles: (params?: Pageable) =>
    apiClient.get<PaginatedResponse<Role>>('/api/permissions/roles', {
      params,
    }),

  getAllRoles: () => apiClient.get<Role[]>('/api/permissions/roles/all'),

  getRole: (id: number) => apiClient.get<Role>(`/api/permissions/roles/${id}`),

  createRole: (role: RoleCreateRequest) =>
    apiClient.post<Role>('/api/permissions/roles', role),

  updateRole: (role: RoleUpdateRequest) =>
    apiClient.put<Role>(`/api/permissions/roles/${role.id}`, role),

  deleteRole: (id: number) => apiClient.delete(`/api/permissions/roles/${id}`),

  // Permission management
  getAllPermissions: () => apiClient.get<Permission[]>('/api/permissions'),

  getPermission: (id: number) =>
    apiClient.get<Permission>(`/api/permissions/${id}`),

  // User role assignment
  getUserRoles: (userId: number) =>
    apiClient.get<Role[]>(`/api/permissions/users/${userId}/roles`),

  assignUserRoles: (assignment: UserRoleAssignment) =>
    apiClient.post<void>('/api/permissions/users/assign-roles', assignment),

  removeUserRole: (userId: number, roleId: number) =>
    apiClient.delete(`/api/permissions/users/${userId}/roles/${roleId}`),

  // Permission impact analysis
  analyzePermissionImpact: (roleId: number, permissionIds: number[]) =>
    apiClient.post<PermissionImpactAnalysis>(
      `/api/permissions/roles/${roleId}/impact-analysis`,
      { permissionIds }
    ),

  // Role-permission matrix
  getRolePermissionMatrix: () =>
    apiClient.get<Record<number, number[]>>('/api/permissions/matrix'),

  updateRolePermissions: (roleId: number, permissionIds: number[]) =>
    apiClient.put<void>(`/api/permissions/roles/${roleId}/permissions`, {
      permissionIds,
    }),

  // Users with roles
  getUsersWithRoles: (params?: Pageable) =>
    apiClient.get<PaginatedResponse<User>>('/api/permissions/users', {
      params,
    }),

  // Bulk operations
  bulkAssignRoles: (userIds: number[], roleIds: number[]) =>
    apiClient.post<void>('/api/permissions/bulk-assign', {
      userIds,
      roleIds,
    }),

  bulkRemoveRoles: (userIds: number[], roleIds: number[]) =>
    apiClient.post<void>('/api/permissions/bulk-remove', {
      userIds,
      roleIds,
    }),
};
