import { apiClient } from './api';
import type {
  Employee,
  EmployeeSearchCriteria,
  PaginatedResponse,
  Pageable,
} from '../types';

export interface EmployeeImportResult {
  successful: number;
  failed: number;
  errors: string[];
}

export interface EmployeeExportOptions {
  format: 'csv' | 'xlsx';
  fields: string[];
  employeeIds?: number[];
}

export interface EmployeeStatistics {
  total: number;
  active: number;
  inactive: number;
  byDepartment: Record<string, number>;
  byStatus: Record<string, number>;
}

export const employeeApi = {
  getAll: (params: Pageable): Promise<PaginatedResponse<Employee>> => {
    return apiClient.get('/api/employees', { params });
  },

  getById: (id: number): Promise<Employee> => {
    return apiClient.get(`/api/employees/${id}`);
  },

  create: (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    return apiClient.post('/api/employees', employee);
  },

  update: (id: number, employee: Employee): Promise<Employee> => {
    return apiClient.put(`/api/employees/${id}`, employee);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete(`/api/employees/${id}`);
  },

  deleteMultiple: (ids: number[]): Promise<{ deletedCount: number }> => {
    return apiClient.delete('/api/employees/bulk', { data: ids });
  },

  search: (
    criteria: EmployeeSearchCriteria
  ): Promise<PaginatedResponse<Employee>> => {
    return apiClient.post('/api/employees/search', criteria);
  },

  import: (file: File): Promise<EmployeeImportResult> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/api/employees/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  export: (options: EmployeeExportOptions): Promise<Blob> => {
    return apiClient.post('/api/employees/export', options, {
      responseType: 'blob',
    });
  },

  getStatistics: (): Promise<EmployeeStatistics> => {
    return apiClient.get('/api/employees/statistics');
  },
};
