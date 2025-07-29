import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { vi } from 'vitest';
import {
  useEmailTemplates,
  useEmailTemplate,
  useSendEmail,
  useEmailRecipients,
  useTemplatePreview,
  useValidateVariables,
} from '../useEmail';
import { emailApi } from '../../services/emailApi';
import type { EmailTemplate, EmailRecipient } from '../../../../types';

// Mock the API
vi.mock('../../services/emailApi');
const mockEmailApi = emailApi as any;

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useEmail hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useEmailTemplates', () => {
    it('should fetch email templates', async () => {
      const mockTemplates: EmailTemplate[] = [
        {
          id: 1,
          name: 'Test Template',
          subject: 'Test Subject',
          content: 'Test Content',
          variables: ['name'],
          description: 'Test Description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockEmailApi.getTemplates.mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useEmailTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTemplates);
      expect(mockEmailApi.getTemplates).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching templates', async () => {
      const error = new Error('Failed to fetch templates');
      mockEmailApi.getTemplates.mockRejectedValue(error);

      const { result } = renderHook(() => useEmailTemplates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useEmailTemplate', () => {
    it('should fetch a specific email template', async () => {
      const mockTemplate: EmailTemplate = {
        id: 1,
        name: 'Test Template',
        subject: 'Test Subject',
        content: 'Test Content',
        variables: ['name'],
        description: 'Test Description',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockEmailApi.getTemplate.mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useEmailTemplate(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTemplate);
      expect(mockEmailApi.getTemplate).toHaveBeenCalledWith(1);
    });

    it('should not fetch when id is 0', () => {
      const { result } = renderHook(() => useEmailTemplate(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockEmailApi.getTemplate).not.toHaveBeenCalled();
    });
  });

  describe('useEmailRecipients', () => {
    it('should fetch email recipients', async () => {
      const mockRecipients: EmailRecipient[] = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          type: 'individual',
        },
        {
          id: 2,
          name: 'Engineering',
          email: 'eng@example.com',
          type: 'department',
        },
      ];

      mockEmailApi.getAvailableRecipients.mockResolvedValue(mockRecipients);

      const { result } = renderHook(() => useEmailRecipients(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecipients);
      expect(mockEmailApi.getAvailableRecipients).toHaveBeenCalledTimes(1);
    });
  });

  describe('useSendEmail', () => {
    it('should send email successfully', async () => {
      mockEmailApi.sendEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSendEmail(), {
        wrapper: createWrapper(),
      });

      const emailRequest = {
        templateId: 1,
        recipients: [1, 2],
        variables: { name: 'John' },
      };

      await result.current.mutateAsync(emailRequest);

      expect(mockEmailApi.sendEmail).toHaveBeenCalledWith(emailRequest);
    });

    it('should handle send email error', async () => {
      const error = new Error('Send failed');
      mockEmailApi.sendEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useSendEmail(), {
        wrapper: createWrapper(),
      });

      const emailRequest = {
        templateId: 1,
        recipients: [1],
        variables: {},
      };

      await expect(result.current.mutateAsync(emailRequest)).rejects.toThrow('Send failed');
    });
  });

  describe('useTemplatePreview', () => {
    it('should fetch template preview when enabled', async () => {
      const mockPreview = {
        subject: 'Hello John',
        content: 'Welcome John to ACME!',
      };

      mockEmailApi.previewTemplate.mockResolvedValue(mockPreview);

      const { result } = renderHook(
        () => useTemplatePreview(1, { name: 'John', company: 'ACME' }, true),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPreview);
      expect(mockEmailApi.previewTemplate).toHaveBeenCalledWith(1, {
        name: 'John',
        company: 'ACME',
      });
    });

    it('should not fetch when disabled', () => {
      const { result } = renderHook(
        () => useTemplatePreview(1, { name: 'John' }, false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockEmailApi.previewTemplate).not.toHaveBeenCalled();
    });

    it('should not fetch when templateId is 0', () => {
      const { result } = renderHook(
        () => useTemplatePreview(0, { name: 'John' }, true),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockEmailApi.previewTemplate).not.toHaveBeenCalled();
    });

    it('should not fetch when variables are empty', () => {
      const { result } = renderHook(() => useTemplatePreview(1, {}, true), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockEmailApi.previewTemplate).not.toHaveBeenCalled();
    });
  });

  describe('useValidateVariables', () => {
    it('should validate variables successfully', async () => {
      const mockValidation = {
        valid: true,
        missingVariables: [],
        invalidVariables: [],
      };

      mockEmailApi.validateVariables.mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useValidateVariables(), {
        wrapper: createWrapper(),
      });

      const validationRequest = {
        templateId: 1,
        variables: { name: 'John', company: 'ACME' },
      };

      const validation = await result.current.mutateAsync(validationRequest);

      expect(validation).toEqual(mockValidation);
      expect(mockEmailApi.validateVariables).toHaveBeenCalledWith(1, {
        name: 'John',
        company: 'ACME',
      });
    });

    it('should handle validation with missing variables', async () => {
      const mockValidation = {
        valid: false,
        missingVariables: ['company'],
        invalidVariables: [],
      };

      mockEmailApi.validateVariables.mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useValidateVariables(), {
        wrapper: createWrapper(),
      });

      const validationRequest = {
        templateId: 1,
        variables: { name: 'John' },
      };

      const validation = await result.current.mutateAsync(validationRequest);

      expect(validation).toEqual(mockValidation);
      expect(validation.valid).toBe(false);
      expect(validation.missingVariables).toContain('company');
    });

    it('should handle validation error', async () => {
      const error = new Error('Validation failed');
      mockEmailApi.validateVariables.mockRejectedValue(error);

      const { result } = renderHook(() => useValidateVariables(), {
        wrapper: createWrapper(),
      });

      const validationRequest = {
        templateId: 1,
        variables: {},
      };

      await expect(result.current.mutateAsync(validationRequest)).rejects.toThrow(
        'Validation failed'
      );
    });
  });


});