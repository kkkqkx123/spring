import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { handleQueryError } from '../services/queryClient';
import type { ApiError } from '../types';

// Enhanced useQuery hook with error handling
export const useQueryWithError = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    onError?: (error: ApiError) => void;
    showErrorNotification?: boolean;
  }
) => {
  const { addNotification } = useUiStore();

  const query = useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });

  // Handle errors using useEffect since onError is deprecated in v5
  useEffect(() => {
    if (query.error) {
      const apiError = handleQueryError(query.error);

      // Show error notification if enabled (default: true)
      if (options?.showErrorNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: apiError.message,
        });
      }

      // Call custom error handler if provided
      options?.onError?.(apiError);
    }
  }, [query.error, options, addNotification]);

  return query;
};

// Enhanced useMutation hook with error handling and success notifications
export const useMutationWithFeedback = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
    showSuccessNotification?: boolean;
    showErrorNotification?: boolean;
    invalidateQueries?: readonly unknown[][];
    optimisticUpdate?: {
      queryKey: readonly unknown[];
      updater: (old: any, variables: TVariables) => any;
    };
  }
) => {
  const { addNotification } = useUiStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async variables => {
      // Handle optimistic updates
      if (options?.optimisticUpdate) {
        const { queryKey, updater } = options.optimisticUpdate;

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(queryKey);

        // Optimistically update to the new value
        queryClient.setQueryData(queryKey, (old: any) =>
          updater(old, variables)
        );

        // Return a context object with the snapshotted value
        return { previousData, queryKey };
      }
    },
    onSuccess: (data, variables) => {
      // Show success notification if enabled (default: true)
      if (options?.showSuccessNotification !== false) {
        addNotification({
          type: 'success',
          title: 'Success',
          message:
            options?.successMessage || 'Operation completed successfully',
        });
      }

      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Call custom success handler if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error: unknown, variables, context: any) => {
      const apiError = handleQueryError(error);

      // Rollback optimistic update if it exists
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }

      // Show error notification if enabled (default: true)
      if (options?.showErrorNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: options?.errorMessage || apiError.message,
        });
      }

      // Call custom error handler if provided
      options?.onError?.(apiError, variables);
    },
    onSettled: (_data, _error, _variables, context: any) => {
      // Always refetch after error or success if optimistic update was used
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
};

// Hook for infinite queries with error handling
export const useInfiniteQueryWithError = <T>(
  queryKey: readonly unknown[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<{
    data: T[];
    nextPage?: number;
    hasNextPage: boolean;
  }>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    onError?: (error: ApiError) => void;
    showErrorNotification?: boolean;
  }
) => {
  const { addNotification } = useUiStore();

  const query = useQuery({
    queryKey,
    queryFn: () => queryFn({ pageParam: 0 }),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
  });

  // Handle errors using useEffect since onError is deprecated in v5
  useEffect(() => {
    if (query.error) {
      const apiError = handleQueryError(query.error);

      // Show error notification if enabled (default: true)
      if (options?.showErrorNotification !== false) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: apiError.message,
        });
      }

      // Call custom error handler if provided
      options?.onError?.(apiError);
    }
  }, [query.error, options, addNotification]);

  return query;
};
