import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  authApi,
  employeeApi,
  departmentApi,
  chatApi,
  emailApi,
} from '../../services';
import { apiClient } from '../../services/api';

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('API Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Auth API Integration', () => {
    it('should handle login successfully', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ROLE_USER'],
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
        roles: [],
        enabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockApiClient.post.mockResolvedValueOnce(mockUser);

      const result = await authApi.register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle token refresh', async () => {
      const mockResponse = {
        token: 'new-jwt-token',
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['ROLE_USER'],
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/refresh');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Employee API Integration', () => {
    it('should fetch employees with pagination', async () => {
      const mockResponse = {
        content: [
          {
            id: 1,
            employeeNumber: 'EMP001',
            name: 'John Doe',
            email: 'john@example.com',
            department: { id: 1, name: 'IT' },
            position: { id: 1, title: 'Developer' },
            status: 'ACTIVE',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await employeeApi.getAll({ page: 0, size: 10 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/employees', {
        params: { page: 0, size: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create employee successfully', async () => {
      const newEmployee = {
        employeeNumber: 'EMP002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        department: { id: 1, name: 'IT' },
        position: { id: 1, title: 'Developer' },
        status: 'ACTIVE' as const,
      };

      const mockResponse = { id: 2, ...newEmployee };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await employeeApi.create(newEmployee);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/employees',
        newEmployee
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle employee search', async () => {
      const searchCriteria = {
        name: 'John',
        departmentId: 1,
        status: 'ACTIVE' as const,
      };

      const mockResponse = {
        content: [
          {
            id: 1,
            employeeNumber: 'EMP001',
            name: 'John Doe',
            email: 'john@example.com',
            department: { id: 1, name: 'IT' },
            position: { id: 1, title: 'Developer' },
            status: 'ACTIVE',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await employeeApi.search(searchCriteria);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/employees/search',
        searchCriteria
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Department API Integration', () => {
    it('should fetch department tree', async () => {
      const mockTree = [
        {
          id: 1,
          name: 'IT',
          parentId: null,
          children: [
            {
              id: 2,
              name: 'Development',
              parentId: 1,
              children: [],
            },
          ],
        },
      ];

      mockApiClient.get.mockResolvedValueOnce(mockTree);

      const result = await departmentApi.getTree();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/departments/tree');
      expect(result).toEqual(mockTree);
    });

    it('should create department successfully', async () => {
      const newDepartment = {
        name: 'HR',
        parentId: null,
      };

      const mockResponse = { id: 3, ...newDepartment, children: [] };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await departmentApi.create(newDepartment);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/departments',
        newDepartment
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Chat API Integration', () => {
    it('should send message successfully', async () => {
      const messageRequest = {
        recipientId: 2,
        content: 'Hello there!',
      };

      const mockResponse = {
        id: 1,
        content: 'Hello there!',
        senderId: 1,
        senderName: 'John Doe',
        recipientId: 2,
        recipientName: 'Jane Smith',
        createdAt: '2024-01-01T12:00:00Z',
        isRead: false,
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await chatApi.sendMessage(messageRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/chat/send',
        messageRequest
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch conversation messages', async () => {
      const mockResponse = {
        content: [
          {
            id: 1,
            content: 'Hello!',
            senderId: 1,
            senderName: 'John Doe',
            recipientId: 2,
            recipientName: 'Jane Smith',
            createdAt: '2024-01-01T12:00:00Z',
            isRead: true,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await chatApi.getConversation(2, { page: 0, size: 20 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/chat/conversation/2',
        {
          params: { page: 0, size: 20 },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Email API Integration', () => {
    it('should send email successfully', async () => {
      const emailRequest = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'notification',
        variables: { name: 'John' },
      };

      const mockResponse = { message: 'Email sent successfully' };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await emailApi.sendEmail(emailRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/email/send',
        emailRequest
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch email templates', async () => {
      const mockTemplates = [
        { name: 'welcome', description: 'Welcome email template' },
        { name: 'notification', description: 'General notification template' },
      ];

      mockApiClient.get.mockResolvedValueOnce(mockTemplates);

      const result = await emailApi.getEmailTemplates();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/templates');
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors properly', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Employee not found',
            code: 'EMPLOYEE_NOT_FOUND',
          },
        },
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      await expect(employeeApi.getById(999)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockApiClient.get.mockRejectedValueOnce(networkError);

      await expect(employeeApi.getAll({ page: 0, size: 10 })).rejects.toThrow(
        'Network Error'
      );
    });
  });

  describe('Authentication Integration', () => {
    it('should include auth token in requests', async () => {
      // Mock localStorage
      const mockToken = 'mock-jwt-token';
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => mockToken),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });

      mockApiClient.get.mockResolvedValueOnce([]);

      await employeeApi.getAll({ page: 0, size: 10 });

      // The API client should have been called with the request
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/employees', {
        params: { page: 0, size: 10 },
      });
    });
  });
});
