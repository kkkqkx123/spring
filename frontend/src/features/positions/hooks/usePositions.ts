import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { apiClient } from '../../../services/api';
import { Position } from '../../../types';

const positionApi = {
  getPositions: async (): Promise<Position[]> => {
    const response = await apiClient.get('/api/positions');
    return response.data;
  },

  getPositionsByDepartment: async (
    departmentId: number
  ): Promise<Position[]> => {
    const response = await apiClient.get(
      `/api/positions/department/${departmentId}`
    );
    return response.data;
  },
};

export const usePositions = () => {
  return useQuery({
    queryKey: queryKeys.positions.all,
    queryFn: positionApi.getPositions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePositionsByDepartment = (departmentId: number) => {
  return useQuery({
    queryKey: queryKeys.positions.byDepartment(departmentId),
    queryFn: () => positionApi.getPositionsByDepartment(departmentId),
    enabled: !!departmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
