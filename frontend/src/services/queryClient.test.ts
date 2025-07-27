import { describe, it, expect, beforeEach } from 'vitest';
import {
  queryClient,
  createQueryClient,
  createDevQueryClient,
  createTestQueryClient,
  handleQueryError,
  createOptimisticUpdate,
  cacheUtils,
} from './queryClient';

describe('QueryClient Configuration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Default Query Client', () => {
    it('should have correct default configuration', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
      expect(defaultOptions.queries?.refetchOnMount).toBe(true);
    });
  });

  describe('Custom Query Clients', () => {
    it('should create query client with custom options', () => {
      const customClient = createQueryClient({
        queries: {
          staleTime: 1000,
        },
      });
      
      const defaultOptions = customClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(1000);
    });

    it('should create development query client', () => {
      const devClient = createDevQueryClient();
      const defaultOptions = devClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.staleTime).toBe(0);
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
    });

    it('should create test query client', () => {
      const testClient = createTestQueryClient();
      const defaultOptions = testClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.retry).toBe(false);
      expect(defaultOptions.queries?.gcTime).toBe(0);
      expect(defaultOptions.queries?.staleTime).toBe(0);
      expect(defaultOptions.mutations?.retry).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const apiError = {
        status: 404,
        message: 'Not found',
        code: 'NOT_FOUND',
      };
      
      const error = new Error('API Error') as any;
      error.status = 404;
      
      const result = handleQueryError(error);
      expect(result.status).toBe(404);
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      const result = handleQueryError(error);
      
      expect(result.status).toBe(-1);
      expect(result.message).toBe('Generic error');
    });

    it('should handle unknown errors', () => {
      const result = handleQueryError('unknown error');
      
      expect(result.status).toBe(-1);
      expect(result.message).toBe('An unknown error occurred');
    });
  });

  describe('Optimistic Updates', () => {
    it('should create optimistic update configuration', () => {
      const queryKey = ['test', 'data'];
      const updater = (old: any) => ({ ...old, updated: true });
      
      const optimisticUpdate = createOptimisticUpdate(queryKey, updater);
      
      expect(optimisticUpdate.onMutate).toBeDefined();
      expect(optimisticUpdate.onError).toBeDefined();
      expect(optimisticUpdate.onSettled).toBeDefined();
    });
  });

  describe('Cache Utils', () => {
    const testQueryKey = ['test', 'cache'];
    const testData = { id: 1, name: 'Test' };

    it('should set and get cache data', () => {
      cacheUtils.setData(testQueryKey, testData);
      const cachedData = cacheUtils.getData(testQueryKey);
      
      expect(cachedData).toEqual(testData);
    });

    it('should clear specific cache', () => {
      cacheUtils.setData(testQueryKey, testData);
      expect(cacheUtils.getData(testQueryKey)).toEqual(testData);
      
      cacheUtils.clear(testQueryKey);
      expect(cacheUtils.getData(testQueryKey)).toBeUndefined();
    });

    it('should clear all cache', () => {
      cacheUtils.setData(testQueryKey, testData);
      cacheUtils.setData(['another', 'key'], { id: 2 });
      
      cacheUtils.clearAll();
      
      expect(cacheUtils.getData(testQueryKey)).toBeUndefined();
      expect(cacheUtils.getData(['another', 'key'])).toBeUndefined();
    });

    it('should prefetch data', async () => {
      const queryFn = async () => testData;
      
      await cacheUtils.prefetch(testQueryKey, queryFn);
      
      const cachedData = cacheUtils.getData(testQueryKey);
      expect(cachedData).toEqual(testData);
    });
  });
});