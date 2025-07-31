import { apiClient } from './api';
import type { Department, DepartmentDto } from '../types';

export const departmentApi = {
  getAll: (): Promise<DepartmentDto[]> => {
    return apiClient.get('/api/departments');
  },

  getById: (id: number): Promise<DepartmentDto> => {
    return apiClient.get(`/api/departments/${id}`);
  },

  create: (department: Omit<DepartmentDto, 'id'>): Promise<DepartmentDto> => {
    return apiClient.post('/api/departments', department);
  },

  update: (id: number, department: DepartmentDto): Promise<DepartmentDto> => {
    return apiClient.put(`/api/departments/${id}`, department);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete(`/api/departments/${id}`);
  },

  getTree: (): Promise<DepartmentDto[]> => {
    return apiClient.get('/api/departments/tree');
  },

  getChildDepartments: (parentId: number): Promise<DepartmentDto[]> => {
    return apiClient.get(`/api/departments/parent/${parentId}`);
  },

  moveDepartment: (
    departmentId: number,
    newParentId: number
  ): Promise<DepartmentDto> => {
    return apiClient.put(
      `/api/departments/${departmentId}/move/${newParentId}`
    );
  },

  getByName: (name: string): Promise<DepartmentDto> => {
    return apiClient.get('/api/departments/by-name', { params: { name } });
  },
};
