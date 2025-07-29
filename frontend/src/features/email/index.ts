// Email feature public API

// Components
export { EmailComposer } from './components/EmailComposer';
export { RecipientPicker } from './components/RecipientPicker';
export { EmailTemplateSelector } from './components/EmailTemplateSelector';
export { EmailValidation } from './components/EmailValidation';
export { BulkEmailSender } from './components/BulkEmailSender';
export { EmailHistory } from './components/EmailHistory';

// Hooks
export {
  useEmailTemplates,
  useEmailTemplate,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useSendEmail,
  useSendBulkEmail,
  useBulkEmailProgress,
  useEmailRecipients,
  useDepartmentRecipients,
  useEmailHistory,
  useEmailDetails,
  useTemplatePreview,
  useValidateVariables,
} from './hooks/useEmail';

// Services
export { emailApi, EmailApi } from './services/emailApi';
export type {
  EmailTemplateRequest,
  BulkEmailRequest,
  EmailSendProgress,
} from './services/emailApi';
