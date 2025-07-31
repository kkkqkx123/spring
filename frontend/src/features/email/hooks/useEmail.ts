import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import {
  emailApi,
  type EmailTemplateRequest,
  type EmailSendProgress,
} from '../services/emailApi';
import type { Pageable } from '../../../types';
// Template hooks
export const useEmailTemplates = () => {
  return useQuery({
    queryKey: queryKeys.email.templates,
    queryFn: () => emailApi.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmailTemplate = (id: number) => {
  return useQuery({
    queryKey: ['email', 'templates', id],
    queryFn: () => emailApi.getTemplate(id),
    enabled: !!id,
  });
};

export const useCreateEmailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.email.templates });
    },
  });
};

export const useUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      template,
    }: {
      id: number;
      template: EmailTemplateRequest;
    }) => emailApi.updateTemplate(id, template),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['email', 'templates', id] });
      queryClient.invalidateQueries({ queryKey: ['email', 'templates'] });
    },
  });
};

export const useDeleteEmailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.email.templates });
    },
  });
};

// Email sending hooks
export const useSendEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailApi.sendEmail,
    onSuccess: () => {
      // Invalidate email history to show the new sent email
      queryClient.invalidateQueries({ queryKey: ['email', 'history'] });
    },
  });
};

export const useSendBulkEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emailApi.sendBulkEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', 'history'] });
    },
  });
};

export const useBulkEmailProgress = (jobId: string, enabled = false) => {
  return useQuery<EmailSendProgress>({
    queryKey: ['email', 'bulkProgress', jobId],
    queryFn: () => emailApi.getBulkEmailProgress(jobId),
    enabled: enabled && !!jobId,
    refetchInterval: query => {
      if (
        query.state.data?.status === 'COMPLETED' ||
        query.state.data?.status === 'FAILED'
      ) {
        return false;
      }
      return 2000;
    },
  });
};

// Recipient hooks
export const useEmailRecipients = () => {
  return useQuery({
    queryKey: ['email', 'recipients'],
    queryFn: () => emailApi.getAvailableRecipients(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDepartmentRecipients = (departmentId: number) => {
  return useQuery({
    queryKey: ['email', 'recipients', 'department', departmentId],
    queryFn: () => emailApi.getDepartmentRecipients(departmentId),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Email history hooks
export const useEmailHistory = (pageable: Pageable) => {
  return useQuery({
    queryKey: ['email', 'history', pageable],
    queryFn: () => emailApi.getEmailHistory(pageable),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useEmailDetails = (id: number) => {
  return useQuery({
    queryKey: ['email', 'details', id],
    queryFn: () => emailApi.getEmailDetails(id),
    enabled: !!id,
  });
};

// Template preview hooks
export const useTemplatePreview = (
  templateId: number,
  variables: Record<string, string>,
  enabled = false
) => {
  return useQuery({
    queryKey: ['email', 'preview', templateId, variables],
    queryFn: () => emailApi.previewTemplate(templateId, variables),
    enabled: enabled && !!templateId && Object.keys(variables).length > 0,
    staleTime: 0, // Always fresh for preview
  });
};

export const useValidateVariables = () => {
  return useMutation({
    mutationFn: ({
      templateId,
      variables,
    }: {
      templateId: number;
      variables: Record<string, string>;
    }) => emailApi.validateVariables(templateId, variables),
  });
};
