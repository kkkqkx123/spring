import { apiClient } from './api';
import type { Position, PositionDto } from '../types';

export const positionApi = {
  getAll: (): Promise<PositionDto[]> => {
    return apiClient.get('/api/positions');
  },

  getById: (id: number): Promise<PositionDto> => {
    return apiClient.get(`/api/positions/${id}`);
  },

  create: (position: Omit<PositionDto, 'id'>): Promise<PositionDto> => {
    return apiClient.post('/api/positions', position);
  },

  update: (id: number, position: PositionDto): Promise<PositionDto> => {
    return apiClient.put(`/api/positions/${id}`, position);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete(`/api/positions/${id}`);
  },

  getByDepartment: (departmentId: number): Promise<PositionDto[]> => {
    return apiClient.get(`/api/positions/department/${departmentId}`);
  },

  search: (searchTerm?: string): Promise<PositionDto[]> => {
    return apiClient.get('/api/positions/search', {
      params: searchTerm ? { searchTerm } : {},
    });
  },

  hasEmployees: (id: number): Promise<boolean> => {
    return apiClient.get(`/api/positions/${id}/has-employees`);
  },
};
