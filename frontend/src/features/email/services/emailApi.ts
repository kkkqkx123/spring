import { apiClient } from '../../../services/api';
import { queryKeys } from '../../../services/queryKeys';
import type {
  EmailTemplate,
  EmailRequest,
  EmailRecipient,
  EmailHistory,
  PaginatedResponse,
  Pageable,
  User,
  Department,
} from '../../../types';

export interface EmailTemplateRequest {
  name: string;
  subject: string;
  content: string;
  variables: string[];
  description?: string;
}

export interface BulkEmailRequest {
  templateId: number;
  departmentIds?: number[];
  employeeIds?: number[];
  variables: Record<string, string>;
  subject?: string;
  customContent?: string;
}

export interface EmailSendProgress {
  total: number;
  sent: number;
  failed: number;
  status: 'PENDING' | 'SENDING' | 'COMPLETED' | 'FAILED';
  errors?: string[];
}

export class EmailApi {
  // Template management
  async getTemplates(): Promise<EmailTemplate[]> {
    return apiClient.get<EmailTemplate[]>('/api/email/templates');
  }

  async getTemplate(id: number): Promise<EmailTemplate> {
    return apiClient.get<EmailTemplate>(`/api/email/templates/${id}`);
  }

  async createTemplate(template: EmailTemplateRequest): Promise<EmailTemplate> {
    return apiClient.post<EmailTemplate>('/api/email/templates', template);
  }

  async updateTemplate(id: number, template: EmailTemplateRequest): Promise<EmailTemplate> {
    return apiClient.put<EmailTemplate>(`/api/email/templates/${id}`, template);
  }

  async deleteTemplate(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/email/templates/${id}`);
  }

  // Email composition and sending
  async sendEmail(request: EmailRequest): Promise<void> {
    return apiClient.post<void>('/api/email/send', request);
  }

  async sendBulkEmail(request: BulkEmailRequest): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>('/api/email/send-bulk', request);
  }

  async getBulkEmailProgress(jobId: string): Promise<EmailSendProgress> {
    return apiClient.get<EmailSendProgress>(`/api/email/bulk-progress/${jobId}`);
  }

  // Recipient management
  async getAvailableRecipients(): Promise<EmailRecipient[]> {
    return apiClient.get<EmailRecipient[]>('/api/email/recipients');
  }

  async getDepartmentRecipients(departmentId: number): Promise<EmailRecipient[]> {
    return apiClient.get<EmailRecipient[]>(`/api/email/recipients/department/${departmentId}`);
  }

  // Email history
  async getEmailHistory(pageable: Pageable): Promise<PaginatedResponse<EmailHistory>> {
    return apiClient.get<PaginatedResponse<EmailHistory>>('/api/email/history', {
      params: pageable,
    });
  }

  async getEmailDetails(id: number): Promise<EmailHistory & { content: string; recipients: EmailRecipient[] }> {
    return apiClient.get(`/api/email/history/${id}`);
  }

  // Template preview
  async previewTemplate(templateId: number, variables: Record<string, string>): Promise<{
    subject: string;
    content: string;
  }> {
    return apiClient.post(`/api/email/templates/${templateId}/preview`, { variables });
  }

  // Variable validation
  async validateVariables(templateId: number, variables: Record<string, string>): Promise<{
    valid: boolean;
    missingVariables: string[];
    invalidVariables: string[];
  }> {
    return apiClient.post(`/api/email/templates/${templateId}/validate`, { variables });
  }
}

export const emailApi = new EmailApi();