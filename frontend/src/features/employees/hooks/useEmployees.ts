import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { queryKeys } from '../../../services/queryKeys';
import { employeeApi, type EmployeeSearchCriteria } from '../services/employeeApi';
import type { Pageable, Employee } from '../../../types';

export const useEmployees = (pageable: Pageable) => {
  return useQuery({
    queryKey: queryKeys.employees.list(pageable),
    queryFn: () => employeeApi.getEmployees(pageable),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeApi.getEmployee(id),
    enabled: !!id,
  });
};

export const useEmployeeSearch = (criteria: EmployeeSearchCriteria, pageable: Pageable) => {
  return useQuery({
    queryKey: queryKeys.employees.search({ criteria, pageable }),
    queryFn: () => employeeApi.searchEmployees(criteria, pageable),
    enabled: Object.keys(criteria).some(key => criteria[key as keyof EmployeeSearchCriteria]),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, employee }: { id: number; employee: any }) =>
      employeeApi.updateEmployee(id, employee),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useDeleteEmployees = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeApi.deleteEmployees,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useEmployeeImport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeApi.importEmployees,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useEmployeeExport = () => {
  return useMutation({
    mutationFn: employeeApi.exportEmployees,
  });
};

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, file }: { employeeId: number; file: File }) =>
      employeeApi.uploadProfilePicture(employeeId, file),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

// Custom hook for managing employee list state
export const useEmployeeListState = () => {
  const [pageable, setPageable] = useState<Pageable>({
    page: 0,
    size: 10,
  });
  
  const [searchCriteria, setSearchCriteria] = useState<EmployeeSearchCriteria>({});
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  const updatePageable = useCallback((updates: Partial<Pageable>) => {
    setPageable(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSearchCriteria = useCallback((updates: Partial<EmployeeSearchCriteria>) => {
    setSearchCriteria(prev => ({ ...prev, ...updates }));
    // Reset to first page when search criteria changes
    setPageable(prev => ({ ...prev, page: 0 }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchCriteria({});
    setPageable(prev => ({ ...prev, page: 0 }));
  }, []);

  return {
    pageable,
    searchCriteria,
    selectedEmployees,
    setSelectedEmployees,
    updatePageable,
    updateSearchCriteria,
    clearSearch,
  };
};

