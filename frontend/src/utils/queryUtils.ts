import { queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import type { PaginatedResponse, Pageable } from '../types';

// Utility functions for common query operations

// Prefetch paginated data
export const prefetchPaginatedData = async <T>(
  queryKeyFactory: (params: Pageable) => readonly unknown[],
  fetchFn: (params: Pageable) => Promise<PaginatedResponse<T>>,
  initialParams: Pageable = { page: 0, size: 10 }
) => {
  const queryKey = queryKeyFactory(initialParams);

  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchFn(initialParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update paginated cache when item is added
export const updatePaginatedCacheOnAdd = <T>(
  queryKeyFactory: (params: Pageable) => readonly unknown[],
  newItem: T,
  params: Pageable = { page: 0, size: 10 }
) => {
  const queryKey = queryKeyFactory(params);

  queryClient.setQueryData<PaginatedResponse<T>>(queryKey, old => {
    if (!old) return old;

    return {
      ...old,
      content: [newItem, ...old.content],
      totalElements: old.totalElements + 1,
    };
  });
};

// Update paginated cache when item is updated
export const updatePaginatedCacheOnUpdate = <T extends { id: number }>(
  queryKeyFactory: (params: Pageable) => readonly unknown[],
  updatedItem: T,
  params: Pageable = { page: 0, size: 10 }
) => {
  const queryKey = queryKeyFactory(params);

  queryClient.setQueryData<PaginatedResponse<T>>(queryKey, old => {
    if (!old) return old;

    return {
      ...old,
      content: old.content.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    };
  });
};

// Update paginated cache when item is deleted
export const updatePaginatedCacheOnDelete = <T extends { id: number }>(
  queryKeyFactory: (params: Pageable) => readonly unknown[],
  deletedItemId: number,
  params: Pageable = { page: 0, size: 10 }
) => {
  const queryKey = queryKeyFactory(params);

  queryClient.setQueryData<PaginatedResponse<T>>(queryKey, old => {
    if (!old) return old;

    return {
      ...old,
      content: old.content.filter(item => item.id !== deletedItemId),
      totalElements: old.totalElements - 1,
    };
  });
};

// Invalidate all related queries for an entity
export const invalidateEntityQueries = (entityType: keyof typeof queryKeys) => {
  queryClient.invalidateQueries({
    queryKey: [entityType],
  });
};

// Clear all cache for an entity type
export const clearEntityCache = (entityType: keyof typeof queryKeys) => {
  queryClient.removeQueries({
    queryKey: [entityType],
  });
};

// Optimistic update helper for single item updates
export const createOptimisticItemUpdate = <T extends { id: number }>(
  detailQueryKey: readonly unknown[],
  listQueryKeys: readonly unknown[][],
  updater: (item: T) => T
) => {
  return {
    onMutate: async (variables: { id: number } & Partial<T>) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: detailQueryKey });

      const previousDetailData = queryClient.getQueryData<T>(detailQueryKey);
      const previousListData: Array<{
        queryKey: readonly unknown[];
        data: any;
      }> = [];

      // Update detail cache
      if (previousDetailData) {
        queryClient.setQueryData<T>(
          detailQueryKey,
          updater(previousDetailData)
        );
      }

      // Update list caches
      for (const listQueryKey of listQueryKeys) {
        await queryClient.cancelQueries({ queryKey: listQueryKey });
        const listData =
          queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

        if (listData) {
          previousListData.push({ queryKey: listQueryKey, data: listData });

          queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
            ...listData,
            content: listData.content.map(item =>
              item.id === variables.id ? updater(item) : item
            ),
          });
        }
      }

      return { previousDetailData, previousListData };
    },
    onError: (error: unknown, variables: unknown, context: any) => {
      // Rollback optimistic updates
      if (context?.previousDetailData) {
        queryClient.setQueryData(detailQueryKey, context.previousDetailData);
      }

      if (context?.previousListData) {
        context.previousListData.forEach(({ queryKey, data }: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      listQueryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  };
};

// Background refetch for critical data
export const backgroundRefetch = async (queryKey: readonly unknown[]) => {
  await queryClient.refetchQueries({
    queryKey,
    type: 'active', // Only refetch if query is currently being used
  });
};

// Preload data for navigation
export const preloadForNavigation = {
  employees: async (params: Pageable = { page: 0, size: 10 }) => {
    await prefetchPaginatedData(
      queryKeys.employees.list,
      // This would be replaced with actual API call
      async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
      }),
      params
    );
  },

  departments: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.departments.tree,
      queryFn: async () => [], // This would be replaced with actual API call
      staleTime: 10 * 60 * 1000, // 10 minutes for department tree
    });
  },

  notifications: async (params: Pageable = { page: 0, size: 20 }) => {
    await prefetchPaginatedData(
      queryKeys.notifications.list,
      // This would be replaced with actual API call
      async () => ({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
      }),
      params
    );
  },
};

// Query state helpers
export const getQueryState = (queryKey: readonly unknown[]) => {
  const query = queryClient.getQueryState(queryKey);
  return {
    isLoading: query?.fetchStatus === 'fetching',
    isError: query?.status === 'error',
    isSuccess: query?.status === 'success',
    error: query?.error,
    dataUpdatedAt: query?.dataUpdatedAt,
    errorUpdatedAt: query?.errorUpdatedAt,
  };
};

// Batch operations for multiple queries
export const batchInvalidate = (queryKeys: readonly unknown[][]) => {
  queryKeys.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
};

export const batchPrefetch = async (
  queries: Array<{
    queryKey: readonly unknown[];
    queryFn: () => Promise<any>;
    staleTime?: number;
  }>
) => {
  await Promise.all(
    queries.map(({ queryKey, queryFn, staleTime }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      })
    )
  );
};
