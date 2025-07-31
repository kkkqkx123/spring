import { vi } from 'vitest';
import { employeeApi } from '../employeeApi';
import { apiClient } from '../api';

// Mock the API client
vi.mock('../api', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockApiClient = apiClient as any;

describe('employeeApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('fetches all employees with pagination', async () => {
            const mockResponse = {
                content: [
                    { id: 1, firstName: 'John', lastName: 'Doe' },
                    { id: 2, firstName: 'Jane', lastName: 'Smith' },
                ],
                totalElements: 2,
                totalPages: 1,
            };

            mockApiClient.get.mockResolvedValue(mockResponse);

            const params = { page: 0, size: 10 };
            const result = await employeeApi.getAll(params);

            expect(mockApiClient.get).toHaveBeenCalledWith('/api/employees', {
                params,
            });
            expect(result).toEqual(mockResponse);
        });

        it('handles API errors', async () => {
            const error = new Error('Network error');
            mockApiClient.get.mockRejectedValue(error);

            await expect(employeeApi.getAll({ page: 0, size: 10 })).rejects.toThrow(
                'Network error'
            );
        });
    });

    describe('getById', () => {
        it('fetches employee by ID', async () => {
            const mockEmployee = { id: 1, firstName: 'John', lastName: 'Doe' };
            mockApiClient.get.mockResolvedValue(mockEmployee);

            const result = await employeeApi.getById(1);

            expect(mockApiClient.get).toHaveBeenCalledWith('/api/employees/1');
            expect(result).toEqual(mockEmployee);
        });
    });

    describe('create', () => {
        it('creates new employee', async () => {
            const newEmployee = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                employeeNumber: 'EMP001',
            };
            const createdEmployee = { id: 1, ...newEmployee };

            mockApiClient.post.mockResolvedValue(createdEmployee);

            const result = await employeeApi.create(newEmployee);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                '/api/employees',
                newEmployee
            );
            expect(result).toEqual(createdEmployee);
        });

        it('validates required fields', async () => {
            const invalidEmployee = {
                firstName: 'John',
                // Missing required fields
            };

            mockApiClient.post.mockRejectedValue(new Error('Validation error'));

            await expect(employeeApi.create(invalidEmployee as any)).rejects.toThrow(
                'Validation error'
            );
        });
    });

    describe('update', () => {
        it('updates existing employee', async () => {
            const updatedEmployee = {
                id: 1,
                firstName: 'John',
                lastName: 'Doe Updated',
                email: 'john.updated@example.com',
            };

            mockApiClient.put.mockResolvedValue(updatedEmployee);

            const result = await employeeApi.update(1, updatedEmployee);

            expect(mockApiClient.put).toHaveBeenCalledWith(
                '/api/employees/1',
                updatedEmployee
            );
            expect(result).toEqual(updatedEmployee);
        });
    });

    describe('delete', () => {
        it('deletes employee by ID', async () => {
            mockApiClient.delete.mockResolvedValue({});

            await employeeApi.delete(1);

            expect(mockApiClient.delete).toHaveBeenCalledWith('/api/employees/1');
        });
    });

    describe('deleteMultiple', () => {
        it('deletes multiple employees', async () => {
            const ids = [1, 2, 3];
            mockApiClient.delete.mockResolvedValue({ deletedCount: 3 });

            const result = await employeeApi.deleteMultiple(ids);

            expect(mockApiClient.delete).toHaveBeenCalledWith('/api/employees/bulk', {
                data: ids,
            });
            expect(result).toEqual({ deletedCount: 3 });
        });
    });

    describe('search', () => {
        it('searches employees with criteria', async () => {
            const searchCriteria = {
                name: 'John',
                departmentId: 1,
                status: 'ACTIVE' as const,
            };
            const mockResults = {
                content: [{ id: 1, firstName: 'John', lastName: 'Doe' }],
                totalElements: 1,
            };

            mockApiClient.post.mockResolvedValue(mockResults);

            const result = await employeeApi.search(searchCriteria);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                '/api/employees/search',
                searchCriteria
            );
            expect(result).toEqual(mockResults);
        });

        it('handles empty search results', async () => {
            const searchCriteria = { name: 'NonExistent' };
            const emptyResults = { content: [], totalElements: 0 };

            mockApiClient.post.mockResolvedValue(emptyResults);

            const result = await employeeApi.search(searchCriteria);

            expect(result).toEqual(emptyResults);
        });
    });

    describe('import', () => {
        it('imports employees from file', async () => {
            const file = new File(['employee data'], 'employees.csv', {
                type: 'text/csv',
            });
            const importResult = {
                successful: 5,
                failed: 0,
                errors: [],
            };

            mockApiClient.post.mockResolvedValue(importResult);

            const result = await employeeApi.import(file);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                '/api/employees/import',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            expect(result).toEqual(importResult);
        });

        it('handles import validation errors', async () => {
            const file = new File(['invalid data'], 'employees.csv', {
                type: 'text/csv',
            });
            const importResult = {
                successful: 0,
                failed: 2,
                errors: [
                    'Invalid email format on row 1',
                    'Missing required field on row 2',
                ],
            };

            mockApiClient.post.mockResolvedValue(importResult);

            const result = await employeeApi.import(file);

            expect(result.failed).toBe(2);
            expect(result.errors).toHaveLength(2);
        });
    });

    describe('export', () => {
        it('exports employees to file', async () => {
            const exportOptions = {
                format: 'csv' as const,
                fields: ['firstName', 'lastName', 'email'],
                employeeIds: [1, 2, 3],
            };
            const mockBlob = new Blob(['employee,data'], { type: 'text/csv' });

            mockApiClient.post.mockResolvedValue(mockBlob);

            const result = await employeeApi.export(exportOptions);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                '/api/employees/export',
                exportOptions,
                {
                    responseType: 'blob',
                }
            );
            expect(result).toEqual(mockBlob);
        });

        it('exports all employees when no IDs specified', async () => {
            const exportOptions = {
                format: 'xlsx' as const,
                fields: ['firstName', 'lastName', 'email'],
            };

            await employeeApi.export(exportOptions);

            expect(mockApiClient.post).toHaveBeenCalledWith(
                '/api/employees/export',
                exportOptions,
                {
                    responseType: 'blob',
                }
            );
        });
    });

    describe('getStatistics', () => {
        it('fetches employee statistics', async () => {
            const mockStats = {
                total: 100,
                active: 95,
                inactive: 5,
                byDepartment: {
                    Engineering: 40,
                    Marketing: 25,
                    Sales: 30,
                },
                byStatus: {
                    ACTIVE: 95,
                    INACTIVE: 5,
                },
            };

            mockApiClient.get.mockResolvedValue(mockStats);

            const result = await employeeApi.getStatistics();

            expect(mockApiClient.get).toHaveBeenCalledWith(
                '/api/employees/statistics'
            );
            expect(result).toEqual(mockStats);
        });
    });

    describe('error handling', () => {
        it('handles network errors', async () => {
            const networkError = new Error('Network Error');
            mockApiClient.get.mockRejectedValue(networkError);

            await expect(employeeApi.getAll({ page: 0, size: 10 })).rejects.toThrow(
                'Network Error'
            );
        });

        it('handles API validation errors', async () => {
            const validationError = {
                response: {
                    status: 400,
                    data: {
                        message: 'Validation failed',
                        errors: {
                            email: 'Invalid email format',
                            employeeNumber: 'Employee number already exists',
                        },
                    },
                },
            };

            mockApiClient.post.mockRejectedValue(validationError);

            await expect(employeeApi.create({} as any)).rejects.toEqual(
                validationError
            );
        });

        it('handles unauthorized errors', async () => {
            const unauthorizedError = {
                response: {
                    status: 401,
                    data: { message: 'Unauthorized' },
                },
            };

            mockApiClient.get.mockRejectedValue(unauthorizedError);

            await expect(employeeApi.getAll({ page: 0, size: 10 })).rejects.toEqual(
                unauthorizedError
            );
        });
    });
});
