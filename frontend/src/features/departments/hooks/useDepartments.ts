import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { apiClient } from '../../../services/api';
import { Department } from '../../../types';

const departmentApi = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get('/api/departments');
    return response.data;
  },

  getDepartmentTree: async (): Promise<Department[]> => {
    const response = await apiClient.get('/api/departments/tree');
    return response.data;
  },
};

export const useDepartments = () => {
  return useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: departmentApi.getDepartments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDepartmentTree = () => {
  return useQuery({
    queryKey: queryKeys.departments.tree,
    queryFn: departmentApi.getDepartmentTree,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
