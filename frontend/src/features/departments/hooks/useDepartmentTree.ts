import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { queryKeys } from '../../../services/queryKeys';
import {
  DepartmentApi,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DepartmentMoveRequest,
} from '../services/departmentApi';
import { Department } from '../../../types';

export const useDepartmentTree = () => {
  return useQuery({
    queryKey: queryKeys.departments.tree,
    queryFn: DepartmentApi.getDepartmentTree,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDepartment = (id: number) => {
  return useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: () => DepartmentApi.getDepartment(id),
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DepartmentApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.tree });
      notifications.show({
        title: 'Success',
        message: 'Department created successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create department',
        color: 'red',
      });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DepartmentApi.updateDepartment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.tree });
      notifications.show({
        title: 'Success',
        message: 'Department updated successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update department',
        color: 'red',
      });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DepartmentApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.tree });
      notifications.show({
        title: 'Success',
        message: 'Department deleted successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete department',
        color: 'red',
      });
    },
  });
};

export const useMoveDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DepartmentApi.moveDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.tree });
      notifications.show({
        title: 'Success',
        message: 'Department moved successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to move department',
        color: 'red',
      });
    },
  });
};

export const useDepartmentEmployees = (id: number) => {
  return useQuery({
    queryKey: ['departments', 'employees', id],
    queryFn: () => DepartmentApi.getDepartmentEmployees(id),
    enabled: !!id,
  });
};
