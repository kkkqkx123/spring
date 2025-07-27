import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { ApiError } from '../types';

// Default query options
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Stale time - how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Cache time - how long data stays in cache after becoming unused
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && 'status' in error) {
        const apiError = error as ApiError;
        if (apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
      }

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (can be disabled for better UX)
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Refetch on mount if data is stale
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error) => {
      if (error instanceof Error && 'status' in error) {
        const apiError = error as ApiError;
        // Don't retry client errors
        if (apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
      }

      // Retry once for server errors or network issues
      return failureCount < 1;
    },

    // Retry delay for mutations
    retryDelay: 1000,
  },
};

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Query client configuration for different environments
export const createQueryClient = (options?: Partial<DefaultOptions>) => {
  return new QueryClient({
    defaultOptions: {
      ...defaultQueryOptions,
      ...options,
    },
  });
};

// Development query client with more aggressive refetching
export const createDevQueryClient = () => {
  return createQueryClient({
    queries: {
      ...defaultQueryOptions.queries,
      staleTime: 0, // Always consider data stale in development
      refetchOnWindowFocus: true, // Refetch on focus in development
    },
  });
};

// Test query client with no retries and no caching
export const createTestQueryClient = () => {
  return createQueryClient({
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  });
};

// Error handling for queries
export const handleQueryError = (error: unknown): ApiError => {
  if (error instanceof Error && 'status' in error) {
    return error as ApiError;
  }

  if (error instanceof Error) {
    return {
      status: -1,
      message: error.message,
    };
  }

  return {
    status: -1,
    message: 'An unknown error occurred',
  };
};

// Optimistic update helpers
export const createOptimisticUpdate = <T>(
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
) => {
  return {
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<T>(queryKey, updater);

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (error: unknown, variables: unknown, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData<T>(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  };
};

// Cache management utilities
export const cacheUtils = {
  // Clear all cache
  clearAll: () => {
    queryClient.clear();
  },

  // Clear cache for specific query key
  clear: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey });
  },

  // Invalidate queries (trigger refetch)
  invalidate: (queryKey: readonly unknown[]) => {
    queryClient.invalidateQueries({ queryKey });
  },

  // Prefetch data
  prefetch: async <T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: { staleTime?: number }
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime,
    });
  },

  // Set query data manually
  setData: <T>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData<T>(queryKey, data);
  },

  // Get cached data
  getData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
};
