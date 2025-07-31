import { apiClient } from '../../../services/api';
import type {
  EmailTemplate,
  EmailRequest,
  EmailRecipient,
  EmailHistory,
  PaginatedResponse,
  Pageable,
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

const API_BASE_PATH = '/api/email';

export class EmailApi {
  // Template management
  async getTemplates(): Promise<EmailTemplate[]> {
    return apiClient.get<EmailTemplate[]>(`${API_BASE_PATH}/templates`);
  }

  async getTemplate(id: number): Promise<EmailTemplate> {
    return apiClient.get<EmailTemplate>(`${API_BASE_PATH}/templates/${id}`);
  }

  async createTemplate(template: EmailTemplateRequest): Promise<EmailTemplate> {
    return apiClient.post<EmailTemplate>(
      `${API_BASE_PATH}/templates`,
      template
    );
  }

  async updateTemplate(
    id: number,
    template: EmailTemplateRequest
  ): Promise<EmailTemplate> {
    return apiClient.put<EmailTemplate>(
      `${API_BASE_PATH}/templates/${id}`,
      template
    );
  }

  async deleteTemplate(id: number): Promise<void> {
    return apiClient.delete<void>(`${API_BASE_PATH}/templates/${id}`);
  }

  // Email composition and sending
  async sendEmail(request: EmailRequest): Promise<void> {
    return apiClient.post<void>(`${API_BASE_PATH}/send`, request);
  }

  async sendBulkEmail(request: BulkEmailRequest): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>(
      `${API_BASE_PATH}/send-bulk`,
      request
    );
  }

  async getBulkEmailProgress(jobId: string): Promise<EmailSendProgress> {
    return apiClient.get<EmailSendProgress>(
      `${API_BASE_PATH}/bulk-progress/${jobId}`
    );
  }

  // Recipient management
  async getAvailableRecipients(): Promise<EmailRecipient[]> {
    return apiClient.get<EmailRecipient[]>(`${API_BASE_PATH}/recipients`);
  }

  async getDepartmentRecipients(
    departmentId: number
  ): Promise<EmailRecipient[]> {
    return apiClient.get<EmailRecipient[]>(
      `${API_BASE_PATH}/recipients/department/${departmentId}`
    );
  }

  // Email history
  async getEmailHistory(
    pageable: Pageable
  ): Promise<PaginatedResponse<EmailHistory>> {
    return apiClient.get<PaginatedResponse<EmailHistory>>(
      `${API_BASE_PATH}/history`,
      {
        params: pageable,
      }
    );
  }

  async getEmailDetails(
    id: number
  ): Promise<EmailHistory & { content: string; recipients: EmailRecipient[] }> {
    return apiClient.get(`${API_BASE_PATH}/history/${id}`);
  }

  // Template preview
  async previewTemplate(
    templateId: number,
    variables: Record<string, string>
  ): Promise<{
    subject: string;
    content: string;
  }> {
    return apiClient.post(`${API_BASE_PATH}/templates/${templateId}/preview`, {
      variables,
    });
  }

  // Variable validation
  async validateVariables(
    templateId: number,
    variables: Record<string, string>
  ): Promise<{
    valid: boolean;
    missingVariables: string[];
    invalidVariables: string[];
  }> {
    return apiClient.post(`${API_BASE_PATH}/templates/${templateId}/validate`, {
      variables,
    });
  }
}

export const emailApi = new EmailApi();
