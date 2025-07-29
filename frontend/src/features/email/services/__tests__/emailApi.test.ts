import { vi } from 'vitest';
import { emailApi, EmailApi } from '../emailApi';
import { apiClient } from '../../../../services/api';
import type { EmailTemplate, EmailRequest, PaginatedResponse, EmailHistory } from '../../../../types';

// Mock the API client
vi.mock('../../../../services/api');
const mockApiClient = apiClient as any;

describe('EmailApi', () => {
  let api: EmailApi;

  beforeEach(() => {
    api = new EmailApi();
    vi.clearAllMocks();
  });

  describe('Template Management', () => {
    const mockTemplate: EmailTemplate = {
      id: 1,
      name: 'Test Template',
      subject: 'Test Subject',
      content: 'Test Content',
      variables: ['name', 'company'],
      description: 'Test Description',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should get all templates', async () => {
      const mockTemplates = [mockTemplate];
      mockApiClient.get.mockResolvedValue(mockTemplates);

      const result = await api.getTemplates();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/templates');
      expect(result).toEqual(mockTemplates);
    });

    it('should get a specific template', async () => {
      mockApiClient.get.mockResolvedValue(mockTemplate);

      const result = await api.getTemplate(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/templates/1');
      expect(result).toEqual(mockTemplate);
    });

    it('should create a new template', async () => {
      const templateRequest = {
        name: 'New Template',
        subject: 'New Subject',
        content: 'New Content',
        variables: ['var1'],
        description: 'New Description',
      };
      mockApiClient.post.mockResolvedValue(mockTemplate);

      const result = await api.createTemplate(templateRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/email/templates', templateRequest);
      expect(result).toEqual(mockTemplate);
    });

    it('should update an existing template', async () => {
      const templateRequest = {
        name: 'Updated Template',
        subject: 'Updated Subject',
        content: 'Updated Content',
        variables: ['var1', 'var2'],
      };
      mockApiClient.put.mockResolvedValue(mockTemplate);

      const result = await api.updateTemplate(1, templateRequest);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/email/templates/1', templateRequest);
      expect(result).toEqual(mockTemplate);
    });

    it('should delete a template', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await api.deleteTemplate(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/email/templates/1');
    });
  });

  describe('Email Sending', () => {
    it('should send a single email', async () => {
      const emailRequest: EmailRequest = {
        templateId: 1,
        recipients: [1, 2],
        variables: { name: 'John', company: 'ACME' },
      };
      mockApiClient.post.mockResolvedValue(undefined);

      await api.sendEmail(emailRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/email/send', emailRequest);
    });

    it('should send bulk email', async () => {
      const bulkRequest = {
        templateId: 1,
        departmentIds: [1, 2],
        employeeIds: [3, 4],
        variables: { name: 'John', company: 'ACME' },
      };
      const mockResponse = { jobId: 'job-123' };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await api.sendBulkEmail(bulkRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/email/send-bulk', bulkRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should get bulk email progress', async () => {
      const mockProgress = {
        total: 100,
        sent: 75,
        failed: 5,
        status: 'SENDING' as const,
        errors: ['Error 1'],
      };
      mockApiClient.get.mockResolvedValue(mockProgress);

      const result = await api.getBulkEmailProgress('job-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/bulk-progress/job-123');
      expect(result).toEqual(mockProgress);
    });
  });

  describe('Recipient Management', () => {
    it('should get available recipients', async () => {
      const mockRecipients = [
        { id: 1, name: 'John Doe', email: 'john@example.com', type: 'individual' },
        { id: 2, name: 'Engineering', email: 'eng@example.com', type: 'department' },
      ];
      mockApiClient.get.mockResolvedValue(mockRecipients);

      const result = await api.getAvailableRecipients();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/recipients');
      expect(result).toEqual(mockRecipients);
    });

    it('should get department recipients', async () => {
      const mockRecipients = [
        { id: 1, name: 'John Doe', email: 'john@example.com', type: 'individual' },
      ];
      mockApiClient.get.mockResolvedValue(mockRecipients);

      const result = await api.getDepartmentRecipients(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/recipients/department/1');
      expect(result).toEqual(mockRecipients);
    });
  });

  describe('Email History', () => {
    it('should get email history', async () => {
      const pageable = { page: 0, size: 10 };
      const mockHistory: PaginatedResponse<EmailHistory> = {
        content: [
          {
            id: 1,
            subject: 'Test Email',
            recipientCount: 5,
            status: 'SENT',
            sentAt: '2024-01-01T00:00:00Z',
            templateName: 'Test Template',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
      };
      mockApiClient.get.mockResolvedValue(mockHistory);

      const result = await api.getEmailHistory(pageable);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/history', {
        params: pageable,
      });
      expect(result).toEqual(mockHistory);
    });

    it('should get email details', async () => {
      const mockDetails = {
        id: 1,
        subject: 'Test Email',
        recipientCount: 5,
        status: 'SENT' as const,
        sentAt: '2024-01-01T00:00:00Z',
        templateName: 'Test Template',
        content: 'Email content',
        recipients: [
          { id: 1, name: 'John Doe', email: 'john@example.com', type: 'individual' as const },
        ],
      };
      mockApiClient.get.mockResolvedValue(mockDetails);

      const result = await api.getEmailDetails(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/email/history/1');
      expect(result).toEqual(mockDetails);
    });
  });

  describe('Template Preview and Validation', () => {
    it('should preview template', async () => {
      const variables = { name: 'John', company: 'ACME' };
      const mockPreview = {
        subject: 'Welcome John',
        content: 'Hello John, welcome to ACME!',
      };
      mockApiClient.post.mockResolvedValue(mockPreview);

      const result = await api.previewTemplate(1, variables);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/email/templates/1/preview', {
        variables,
      });
      expect(result).toEqual(mockPreview);
    });

    it('should validate variables', async () => {
      const variables = { name: 'John' };
      const mockValidation = {
        valid: false,
        missingVariables: ['company'],
        invalidVariables: [],
      };
      mockApiClient.post.mockResolvedValue(mockValidation);

      const result = await api.validateVariables(1, variables);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/email/templates/1/validate', {
        variables,
      });
      expect(result).toEqual(mockValidation);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors when getting templates', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(api.getTemplates()).rejects.toThrow('Network error');
    });

    it('should handle API errors when sending email', async () => {
      const emailRequest: EmailRequest = {
        templateId: 1,
        recipients: [1],
        variables: {},
      };
      const error = new Error('Send failed');
      mockApiClient.post.mockRejectedValue(error);

      await expect(api.sendEmail(emailRequest)).rejects.toThrow('Send failed');
    });

    it('should handle API errors when validating variables', async () => {
      const error = new Error('Validation failed');
      mockApiClient.post.mockRejectedValue(error);

      await expect(api.validateVariables(1, {})).rejects.toThrow('Validation failed');
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(emailApi).toBeInstanceOf(EmailApi);
    });
  });
});