import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import {
  permissionApi,
  type RoleCreateRequest,
  type RoleUpdateRequest,
  type UserRoleAssignment as UserRoleAssignmentRequest,
} from '../services/permissionApi';
import type { Role, Permission, User, Pageable } from '../../../types';
import { notifications } from '@mantine/notifications';

// Roles
export const useRoles = (params?: Pageable) => {
  return useQuery({
    queryKey: queryKeys.permissions.roles,
    queryFn: () => permissionApi.getRoles(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllRoles = () => {
  return useQuery({
    queryKey: ['permissions', 'roles', 'all'],
    queryFn: () => permissionApi.getAllRoles(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRole = (id: number) => {
  return useQuery({
    queryKey: queryKeys.permissions.role(id),
    queryFn: () => permissionApi.getRole(id),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: RoleCreateRequest) => permissionApi.createRole(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.roles });
      notifications.show({
        title: 'Success',
        message: 'Role created successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create role',
        color: 'red',
      });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: RoleUpdateRequest) => permissionApi.updateRole(role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.roles });
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.role(variables.id),
      });
      notifications.show({
        title: 'Success',
        message: 'Role updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update role',
        color: 'red',
      });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => permissionApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.roles });
      notifications.show({
        title: 'Success',
        message: 'Role deleted successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete role',
        color: 'red',
      });
    },
  });
};

// Permissions
export const useAllPermissions = () => {
  return useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionApi.getAllPermissions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions change rarely
  });
};

// User roles
export const useUserRoles = (userId: number) => {
  return useQuery({
    queryKey: queryKeys.permissions.userRoles(userId),
    queryFn: () => permissionApi.getUserRoles(userId),
    enabled: !!userId,
  });
};

export const useAssignUserRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: UserRoleAssignmentRequest) =>
      permissionApi.assignUserRoles(assignment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.userRoles(variables.userId),
      });
      notifications.show({
        title: 'Success',
        message: 'User roles updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update user roles',
        color: 'red',
      });
    },
  });
};

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      permissionApi.removeUserRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.userRoles(variables.userId),
      });
      notifications.show({
        title: 'Success',
        message: 'Role removed from user successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to remove role from user',
        color: 'red',
      });
    },
  });
};

// Permission impact analysis
export const usePermissionImpactAnalysis = () => {
  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) => permissionApi.analyzePermissionImpact(roleId, permissionIds),
  });
};

// Role-permission matrix
export const useRolePermissionMatrix = () => {
  return useQuery({
    queryKey: ['permissions', 'matrix'],
    queryFn: () => permissionApi.getRolePermissionMatrix(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) => permissionApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'matrix'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.roles });
      notifications.show({
        title: 'Success',
        message: 'Role permissions updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update role permissions',
        color: 'red',
      });
    },
  });
};

// Users with roles
export const useUsersWithRoles = (params?: Pageable) => {
  return useQuery({
    queryKey: ['permissions', 'users', params],
    queryFn: () => permissionApi.getUsersWithRoles(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Bulk operations
export const useBulkAssignRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userIds,
      roleIds,
    }: {
      userIds: number[];
      roleIds: number[];
    }) => permissionApi.bulkAssignRoles(userIds, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'users'] });
      notifications.show({
        title: 'Success',
        message: 'Roles assigned to users successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to assign roles to users',
        color: 'red',
      });
    },
  });
};

export const useBulkRemoveRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userIds,
      roleIds,
    }: {
      userIds: number[];
      roleIds: number[];
    }) => permissionApi.bulkRemoveRoles(userIds, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'users'] });
      notifications.show({
        title: 'Success',
        message: 'Roles removed from users successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to remove roles from users',
        color: 'red',
      });
    },
  });
};
