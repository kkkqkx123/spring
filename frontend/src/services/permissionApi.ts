import { apiClient } from './api';
import type { Role, Resource, User } from '../types';

export interface PermissionCheckResponse {
  hasPermission: boolean;
  resource: string;
}

export const permissionApi = {
  // Role management
  getAllRoles: (): Promise<Role[]> => {
    return apiClient.get('/api/permissions/roles');
  },

  getRoleById: (id: number): Promise<Role> => {
    return apiClient.get(`/api/permissions/roles/${id}`);
  },

  createRole: (role: Omit<Role, 'id'>): Promise<Role> => {
    return apiClient.post('/api/permissions/roles', role);
  },

  updateRole: (id: number, role: Role): Promise<Role> => {
    return apiClient.put(`/api/permissions/roles/${id}`, role);
  },

  deleteRole: (id: number): Promise<void> => {
    return apiClient.delete(`/api/permissions/roles/${id}`);
  },

  // Resource management
  getAllResources: (): Promise<Resource[]> => {
    return apiClient.get('/api/permissions/resources');
  },

  createResource: (resource: Omit<Resource, 'id'>): Promise<Resource> => {
    return apiClient.post('/api/permissions/resources', resource);
  },

  // User role assignment
  assignRoleToUser: (userId: number, roleId: number): Promise<{ message: string }> => {
    return apiClient.post(`/api/permissions/users/${userId}/roles/${roleId}`);
  },

  removeRoleFromUser: (userId: number, roleId: number): Promise<{ message: string }> => {
    return apiClient.delete(`/api/permissions/users/${userId}/roles/${roleId}`);
  },

  getUserRoles: (userId: number): Promise<Role[]> => {
    return apiClient.get(`/api/permissions/users/${userId}/roles`);
  },

  // Role resource assignment
  assignResourceToRole: (roleName: string, resourceId: number): Promise<Role> => {
    return apiClient.post(`/api/permissions/roles/${roleName}/resources/${resourceId}`);
  },

  removeResourceFromRole: (roleId: number, resourceId: number): Promise<{ message: string }> => {
    return apiClient.delete(`/api/permissions/roles/${roleId}/resources/${resourceId}`);
  },

  getRoleResources: (roleId: number): Promise<Resource[]> => {
    return apiClient.get(`/api/permissions/roles/${roleId}/resources`);
  },

  // Permission checking
  checkUserPermission: (userId: number, resource: string): Promise<PermissionCheckResponse> => {
    return apiClient.get(`/api/permissions/users/${userId}/check`, {
      params: { resource }
    });
  },
};