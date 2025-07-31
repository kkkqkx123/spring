import { apiClient } from './api';

export interface EmailRequest {
  to?: string;
  recipients?: string[];
  subject: string;
  template: string;
  variables: Record<string, any>;
}

export interface EmailTemplate {
  name: string;
  description: string;
}

export interface EmailPreview {
  html: string;
  subject: string;
}

export const emailApi = {
  // Send single email
  sendEmail: (request: EmailRequest): Promise<{ message: string }> => {
    return apiClient.post('/api/email/send', request);
  },

  // Send bulk emails
  sendBulkEmails: (
    request: EmailRequest
  ): Promise<{ message: string; count: number }> => {
    return apiClient.post('/api/email/send-bulk', request);
  },

  // Send email to specific employee
  sendEmailToEmployee: (
    employeeId: number,
    request: Omit<EmailRequest, 'to' | 'recipients'>
  ): Promise<{ message: string }> => {
    return apiClient.post(`/api/email/send-to-employee/${employeeId}`, request);
  },

  // Send email to department
  sendEmailToDepartment: (
    departmentId: number,
    request: Omit<EmailRequest, 'to' | 'recipients'>
  ): Promise<{ message: string }> => {
    return apiClient.post(
      `/api/email/send-to-department/${departmentId}`,
      request
    );
  },

  // Get available email templates
  getEmailTemplates: (): Promise<EmailTemplate[]> => {
    return apiClient.get('/api/email/templates');
  },

  // Preview email template
  previewEmailTemplate: (
    templateName: string,
    variables: Record<string, any>
  ): Promise<EmailPreview> => {
    return apiClient.post(
      `/api/email/templates/${templateName}/preview`,
      variables
    );
  },
};
