import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  Textarea,
  MultiSelect,
  Card,
  Text,
  Badge,
  Alert,
  LoadingOverlay,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSend,
  IconEye,
  IconUsers,
  IconUser,
  IconBuilding,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import {
  useEmailTemplates,
  useEmailTemplate,
  useEmailRecipients,
  useSendEmail,
  useTemplatePreview,
  useValidateVariables,
} from '../hooks/useEmail';
import { useDepartments } from '../../departments/hooks/useDepartments';
import type { EmailRecipient, EmailComposition } from '../../../types';

interface EmailComposerProps {
  onSent?: () => void;
  onCancel?: () => void;
  initialData?: Partial<EmailComposition>;
}

interface FormValues {
  templateId: string;
  recipients: string[];
  subject: string;
  content: string;
  variables: Record<string, string>;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  onSent,
  onCancel,
  initialData,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(false);

  // API hooks
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();
  const { data: recipients, isLoading: recipientsLoading } = useEmailRecipients();
  const { data: departments } = useDepartments();
  const sendEmailMutation = useSendEmail();
  const validateVariablesMutation = useValidateVariables();

  // Form setup
  const form = useForm<FormValues>({
    initialValues: {
      templateId: initialData?.templateId?.toString() || '',
      recipients: initialData?.recipients?.map(r => r.id.toString()) || [],
      subject: initialData?.subject || '',
      content: initialData?.content || '',
      variables: initialData?.variables || {},
    },
    validate: {
      recipients: (value) => 
        value.length === 0 ? 'At least one recipient is required' : null,
      subject: (value) => 
        value.trim().length === 0 ? 'Subject is required' : null,
      content: (value) => 
        value.trim().length === 0 ? 'Content is required' : null,
    },
  });

  // Get selected template data
  const selectedTemplateId = form.values.templateId ? parseInt(form.values.templateId) : 0;
  const { data: selectedTemplate } = useEmailTemplate(selectedTemplateId);

  // Template preview
  const { data: preview, isLoading: previewLoading } = useTemplatePreview(
    selectedTemplateId,
    form.values.variables,
    previewEnabled && !!selectedTemplate
  );

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      form.setValues({
        ...form.values,
        subject: selectedTemplate.subject,
        content: selectedTemplate.content,
        variables: selectedTemplate.variables.reduce((acc, variable) => {
          acc[variable] = form.values.variables[variable] || '';
          return acc;
        }, {} as Record<string, string>),
      });
    }
  }, [selectedTemplate]);

  // Prepare select options
  const templateOptions = (templates || []).map(template => ({
    value: template.id.toString(),
    label: template.name,
    description: template.description,
  }));

  const recipientOptions = (recipients || []).map(recipient => ({
    value: recipient.id.toString(),
    label: `${recipient.name} (${recipient.email})`,
    group: recipient.type === 'department' ? 'Departments' : 'Individuals',
  }));

  // Get selected recipients data
  const selectedRecipients = (recipients || []).filter(r => 
    form.values.recipients.includes(r.id.toString())
  );

  const handleTemplateChange = (templateId: string | null) => {
    form.setFieldValue('templateId', templateId || '');
    if (!templateId) {
      form.setValues({
        ...form.values,
        templateId: '',
        subject: '',
        content: '',
        variables: {},
      });
    }
  };

  const handlePreview = () => {
    if (selectedTemplate && Object.keys(form.values.variables).length > 0) {
      setPreviewEnabled(true);
      setShowPreview(true);
    } else {
      setShowPreview(!showPreview);
    }
  };

  const handleValidateVariables = async () => {
    if (!selectedTemplateId) return;

    try {
      const result = await validateVariablesMutation.mutateAsync({
        templateId: selectedTemplateId,
        variables: form.values.variables,
      });

      if (!result.valid) {
        notifications.show({
          title: 'Variable Validation Failed',
          message: `Missing variables: ${result.missingVariables.join(', ')}`,
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
        return false;
      }

      return true;
    } catch (error) {
      notifications.show({
        title: 'Validation Error',
        message: 'Failed to validate template variables',
        color: 'red',
        icon: <IconX size={16} />,
      });
      return false;
    }
  };

  const handleSubmit = async (values: FormValues) => {
    // Validate variables if template is selected
    if (selectedTemplateId) {
      const isValid = await handleValidateVariables();
      if (!isValid) return;
    }

    try {
      await sendEmailMutation.mutateAsync({
        templateId: selectedTemplateId || undefined,
        recipients: values.recipients.map(id => parseInt(id)),
        variables: values.variables,
        subject: values.subject,
        customContent: selectedTemplateId ? undefined : values.content,
      });

      notifications.show({
        title: 'Email Sent',
        message: `Email sent successfully to ${selectedRecipients.length} recipient(s)`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      form.reset();
      onSent?.();
    } catch (error) {
      notifications.show({
        title: 'Send Failed',
        message: 'Failed to send email. Please try again.',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  const isLoading = templatesLoading || recipientsLoading || sendEmailMutation.isPending;

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={isLoading} />
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Text size="lg" fw={600}>Compose Email</Text>
            <Group gap="xs">
              <Tooltip label="Preview email">
                <ActionIcon
                  variant="light"
                  onClick={handlePreview}
                  disabled={!form.values.subject || !form.values.content}
                >
                  <IconEye size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Template Selection */}
          <Select
            label="Email Template"
            placeholder="Select a template (optional)"
            data={templateOptions}
            value={form.values.templateId}
            onChange={handleTemplateChange}
            searchable
            clearable
            description="Choose a pre-defined template or compose a custom email"
          />

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <Card withBorder>
              <Stack gap="sm">
                <Group gap="xs">
                  <Text size="sm" fw={500}>Template Variables</Text>
                  <Badge size="xs" variant="light">
                    {selectedTemplate.variables.length} variables
                  </Badge>
                </Group>
                
                <Stack gap="xs">
                  {selectedTemplate.variables.map((variable) => (
                    <TextInput
                      key={variable}
                      label={variable}
                      placeholder={`Enter value for ${variable}`}
                      value={form.values.variables[variable] || ''}
                      onChange={(event) =>
                        form.setFieldValue(`variables.${variable}`, event.currentTarget.value)
                      }
                      required
                    />
                  ))}
                </Stack>

                <Button
                  variant="light"
                  size="xs"
                  onClick={handleValidateVariables}
                  loading={validateVariablesMutation.isPending}
                >
                  Validate Variables
                </Button>
              </Stack>
            </Card>
          )}

          {/* Recipients */}
          <MultiSelect
            label="Recipients"
            placeholder="Select recipients"
            data={recipientOptions}
            value={form.values.recipients}
            onChange={(value) => form.setFieldValue('recipients', value)}
            searchable
            required
            error={form.errors.recipients}
            description="Select individual employees or entire departments"
          />

          {/* Selected Recipients Summary */}
          {selectedRecipients.length > 0 && (
            <Card withBorder>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Selected Recipients ({selectedRecipients.length})</Text>
                <Group gap="xs">
                  {selectedRecipients.map((recipient) => (
                    <Badge
                      key={recipient.id}
                      variant="light"
                      leftSection={
                        recipient.type === 'department' ? 
                          <IconBuilding size={12} /> : 
                          <IconUser size={12} />
                      }
                    >
                      {recipient.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Card>
          )}

          {/* Subject */}
          <TextInput
            label="Subject"
            placeholder="Enter email subject"
            value={form.values.subject}
            onChange={(event) => form.setFieldValue('subject', event.currentTarget.value)}
            required
            error={form.errors.subject}
          />

          {/* Content */}
          <Textarea
            label="Content"
            placeholder="Enter email content"
            value={form.values.content}
            onChange={(event) => form.setFieldValue('content', event.currentTarget.value)}
            required
            error={form.errors.content}
            minRows={6}
            autosize
          />

          {/* Preview */}
          {showPreview && (
            <Card withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500}>Email Preview</Text>
                <Divider />
                
                {previewLoading ? (
                  <Text size="sm" c="dimmed">Loading preview...</Text>
                ) : preview ? (
                  <Stack gap="xs">
                    <div>
                      <Text size="xs" c="dimmed">Subject:</Text>
                      <Text size="sm" fw={500}>{preview.subject}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">Content:</Text>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {preview.content}
                      </Text>
                    </div>
                  </Stack>
                ) : (
                  <Stack gap="xs">
                    <div>
                      <Text size="xs" c="dimmed">Subject:</Text>
                      <Text size="sm" fw={500}>{form.values.subject}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">Content:</Text>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {form.values.content}
                      </Text>
                    </div>
                  </Stack>
                )}
              </Stack>
            </Card>
          )}

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            {onCancel && (
              <Button variant="light" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              leftSection={<IconSend size={16} />}
              loading={sendEmailMutation.isPending}
              disabled={selectedRecipients.length === 0}
            >
              Send Email
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};