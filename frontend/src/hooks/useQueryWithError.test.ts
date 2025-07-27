import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useQueryWithError, useMutationWithFeedback } from './useQueryWithError';
import { useUiStore } from '../stores/uiStore';

// Mock the UI store
vi.mock('../stores/uiStore', () => ({
    useUiStore: vi.fn(),
}));

// Mock the query client utilities
vi.mock('../services/queryClient', () => ({
    handleQueryError: vi.fn((error) => ({
        status: error.status || -1,
        message: error.message || 'Unknown error',
    })),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useQueryWithError', () => {
    const mockAddNotification = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useUiStore as any).mockReturnValue({
            addNotification: mockAddNotification,
        });
    });

    it('should handle successful query', async () => {
        const mockData = { id: 1, name: 'Test' };
        const queryFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () => useQueryWithError(['test'], queryFn),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockData);
        expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should handle query error with notification', async () => {
        const error = new Error('Test error');
        const queryFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(
            () => useQueryWithError(['test'], queryFn),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        await waitFor(() => {
            expect(mockAddNotification).toHaveBeenCalledWith({
                type: 'error',
                title: 'Error',
                message: 'Test error',
            });
        });
    });

    it('should not show notification when disabled', async () => {
        const error = new Error('Test error');
        const queryFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(
            () =>
                useQueryWithError(['test'], queryFn, {
                    showErrorNotification: false,
                }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        // Wait a bit to ensure notification is not called
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should call custom error handler', async () => {
        const error = new Error('Test error');
        const queryFn = vi.fn().mockRejectedValue(error);
        const onError = vi.fn();

        const { result } = renderHook(
            () =>
                useQueryWithError(['test'], queryFn, {
                    onError,
                }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith({
                status: -1,
                message: 'Test error',
            });
        });
    });
});

describe('useMutationWithFeedback', () => {
    const mockAddNotification = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useUiStore as any).mockReturnValue({
            addNotification: mockAddNotification,
        });
    });

    it('should handle successful mutation with notification', async () => {
        const mockData = { id: 1, name: 'Created' };
        const mutationFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () => useMutationWithFeedback(mutationFn),
            { wrapper: createWrapper() }
        );

        result.current.mutate({ name: 'Test' });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockAddNotification).toHaveBeenCalledWith({
            type: 'success',
            title: 'Success',
            message: 'Operation completed successfully',
        });
    });

    it('should handle mutation error with notification', async () => {
        const error = new Error('Mutation failed');
        const mutationFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(
            () => useMutationWithFeedback(mutationFn),
            { wrapper: createWrapper() }
        );

        result.current.mutate({ name: 'Test' });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(mockAddNotification).toHaveBeenCalledWith({
            type: 'error',
            title: 'Error',
            message: 'Mutation failed',
        });
    });

    it('should use custom success message', async () => {
        const mockData = { id: 1, name: 'Created' };
        const mutationFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useMutationWithFeedback(mutationFn, {
                    successMessage: 'Custom success message',
                }),
            { wrapper: createWrapper() }
        );

        result.current.mutate({ name: 'Test' });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockAddNotification).toHaveBeenCalledWith({
            type: 'success',
            title: 'Success',
            message: 'Custom success message',
        });
    });

    it('should not show notifications when disabled', async () => {
        const mockData = { id: 1, name: 'Created' };
        const mutationFn = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(
            () =>
                useMutationWithFeedback(mutationFn, {
                    showSuccessNotification: false,
                    showErrorNotification: false,
                }),
            { wrapper: createWrapper() }
        );

        result.current.mutate({ name: 'Test' });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should call custom success handler', async () => {
        const mockData = { id: 1, name: 'Created' };
        const mutationFn = vi.fn().mockResolvedValue(mockData);
        const onSuccess = vi.fn();

        const { result } = renderHook(
            () =>
                useMutationWithFeedback(mutationFn, {
                    onSuccess,
                }),
            { wrapper: createWrapper() }
        );

        const variables = { name: 'Test' };
        result.current.mutate(variables);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(onSuccess).toHaveBeenCalledWith(mockData, variables);
    });
});