import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { apiClient } from '../../../services/api';
import type { Position } from '../../../types';

const positionApi = {
  getPositions: (): Promise<Position[]> => {
    return apiClient.get<Position[]>('/api/positions');
  },

  getPositionsByDepartment: (departmentId: number): Promise<Position[]> => {
    return apiClient.get<Position[]>(
      `/api/positions/department/${departmentId}`
    );
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
