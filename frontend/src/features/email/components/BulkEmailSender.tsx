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
  Progress,
  List,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSend,
  IconUsers,
  IconBuilding,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import {
  useEmailTemplates,
  useEmailTemplate,
  useSendBulkEmail,
  useBulkEmailProgress,
  useValidateVariables,
} from '../hooks/useEmail';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { useEmployees } from '../../employees/hooks/useEmployees';
import type { BulkEmailRequest } from '../services/emailApi';
import type { EmailTemplate } from '../../../types';

interface BulkEmailSenderProps {
  onSent?: () => void;
  onCancel?: () => void;
  initialData?: Partial<BulkEmailRequest>;
}

interface FormValues {
  templateId: string;
  departmentIds: string[];
  employeeIds: string[];
  subject: string;
  customContent: string;
  variables: Record<string, string>;
}

export const BulkEmailSender: React.FC<BulkEmailSenderProps> = ({
  onSent,
  onCancel,
  initialData,
}) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  // API hooks
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: employees, isLoading: employeesLoading } = useEmployees({
    page: 0,
    size: 1000,
  });
  const sendBulkEmailMutation = useSendBulkEmail();
  const validateVariablesMutation = useValidateVariables();

  // Form setup
  const form = useForm<FormValues>({
    initialValues: {
      templateId: initialData?.templateId?.toString() || '',
      departmentIds: initialData?.departmentIds?.map(id => id.toString()) || [],
      employeeIds: initialData?.employeeIds?.map(id => id.toString()) || [],
      subject: initialData?.subject || '',
      customContent: initialData?.customContent || '',
      variables: initialData?.variables || {},
    },
    validate: {
      templateId: value =>
        value.trim().length === 0 ? 'Template is required' : null,
      departmentIds: (value, values) =>
        value.length === 0 && values.employeeIds.length === 0
          ? 'At least one department or employee must be selected'
          : null,
    },
  });

  // Get selected template data
  const selectedTemplateId = form.values.templateId
    ? parseInt(form.values.templateId)
    : 0;
  const { data: selectedTemplate } = useEmailTemplate(selectedTemplateId);

  // Progress tracking
  const { data: progress, isLoading: progressLoading } = useBulkEmailProgress(
    jobId || '',
    !!jobId && showProgress
  );

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      form.setValues({
        ...form.values,
        subject: selectedTemplate.subject,
        customContent: selectedTemplate.content,
        variables: selectedTemplate.variables.reduce(
          (acc, variable) => {
            acc[variable] = form.values.variables[variable] || '';
            return acc;
          },
          {} as Record<string, string>
        ),
      });
    }
  }, [selectedTemplate]);

  // Prepare select options
  const templateOptions = (templates || []).map(template => ({
    value: template.id.toString(),
    label: template.name,
    description: template.description,
  }));

  const departmentOptions = (departments || []).map(dept => ({
    value: dept.id.toString(),
    label: dept.name,
  }));

  const employeeOptions = (employees?.content || []).map(emp => ({
    value: emp.id.toString(),
    label: `${emp.firstName} ${emp.lastName} (${emp.email})`,
  }));

  // Calculate recipient count
  const selectedDepartments = (departments || []).filter(dept =>
    form.values.departmentIds.includes(dept.id.toString())
  );
  const selectedEmployees = (employees?.content || []).filter(emp =>
    form.values.employeeIds.includes(emp.id.toString())
  );

  const estimatedRecipientCount =
    selectedDepartments.reduce((count, dept) => count + dept.employeeCount, 0) +
    selectedEmployees.length;

  const handleValidateVariables = async () => {
    if (!selectedTemplateId) return true;

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
      const result = await sendBulkEmailMutation.mutateAsync({
        templateId: selectedTemplateId,
        departmentIds: values.departmentIds.map(id => parseInt(id)),
        employeeIds: values.employeeIds.map(id => parseInt(id)),
        variables: values.variables,
        subject: values.subject,
        customContent: values.customContent,
      });

      setJobId(result.jobId);
      setShowProgress(true);

      notifications.show({
        title: 'Bulk Email Started',
        message: `Bulk email job started. Sending to approximately ${estimatedRecipientCount} recipients.`,
        color: 'blue',
        icon: <IconSend size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: 'Send Failed',
        message: 'Failed to start bulk email job. Please try again.',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  // Handle progress completion
  useEffect(() => {
    if (
      progress &&
      (progress.status === 'COMPLETED' || progress.status === 'FAILED')
    ) {
      if (progress.status === 'COMPLETED') {
        notifications.show({
          title: 'Bulk Email Completed',
          message: `Successfully sent ${progress.sent} emails. ${progress.failed} failed.`,
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        onSent?.();
      } else {
        notifications.show({
          title: 'Bulk Email Failed',
          message: `Bulk email job failed. ${progress.sent} sent, ${progress.failed} failed.`,
          color: 'red',
          icon: <IconX size={16} />,
        });
      }
      setShowProgress(false);
      setJobId(null);
    }
  }, [progress, onSent]);

  const isLoading =
    templatesLoading ||
    departmentsLoading ||
    employeesLoading ||
    sendBulkEmailMutation.isPending;

  return (
    <Paper p="md" withBorder>
      <LoadingOverlay visible={isLoading} />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              Bulk Email Sender
            </Text>
            <Badge variant="light" size="lg">
              ~{estimatedRecipientCount} recipients
            </Badge>
          </Group>

          {/* Progress Display */}
          {showProgress && progress && (
            <Card withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Bulk Email Progress
                  </Text>
                  <Badge
                    color={
                      progress.status === 'COMPLETED'
                        ? 'green'
                        : progress.status === 'FAILED'
                          ? 'red'
                          : progress.status === 'SENDING'
                            ? 'blue'
                            : 'gray'
                    }
                  >
                    {progress.status}
                  </Badge>
                </Group>

                <Progress
                  value={
                    ((progress.sent + progress.failed) / progress.total) * 100
                  }
                  color={progress.failed > 0 ? 'orange' : 'blue'}
                />

                <Group gap="md">
                  <div>
                    <Text size="xs" c="dimmed">
                      Total
                    </Text>
                    <Text size="sm" fw={500}>
                      {progress.total}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Sent
                    </Text>
                    <Text size="sm" fw={500} c="green">
                      {progress.sent}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Failed
                    </Text>
                    <Text size="sm" fw={500} c="red">
                      {progress.failed}
                    </Text>
                  </div>
                </Group>

                {progress.errors && progress.errors.length > 0 && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red">
                    <Text size="sm" fw={500}>
                      Errors:
                    </Text>
                    <List size="sm">
                      {progress.errors.slice(0, 5).map((error, index) => (
                        <List.Item key={index}>{error}</List.Item>
                      ))}
                      {progress.errors.length > 5 && (
                        <List.Item>
                          ... and {progress.errors.length - 5} more
                        </List.Item>
                      )}
                    </List>
                  </Alert>
                )}
              </Stack>
            </Card>
          )}

          {/* Template Selection */}
          <Select
            label="Email Template"
            placeholder="Select a template"
            data={templateOptions}
            value={form.values.templateId}
            onChange={value => form.setFieldValue('templateId', value || '')}
            searchable
            required
            error={form.errors.templateId}
            description="Choose a template for the bulk email"
          />

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <Card withBorder>
              <Stack gap="sm">
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Template Variables
                  </Text>
                  <Badge size="xs" variant="light">
                    {selectedTemplate.variables.length} variables
                  </Badge>
                </Group>

                <Stack gap="xs">
                  {selectedTemplate.variables.map(variable => (
                    <TextInput
                      key={variable}
                      label={variable}
                      placeholder={`Enter value for ${variable}`}
                      value={form.values.variables[variable] || ''}
                      onChange={event =>
                        form.setFieldValue(
                          `variables.${variable}`,
                          event.currentTarget.value
                        )
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

          {/* Department Selection */}
          <MultiSelect
            label="Departments"
            placeholder="Select departments (all employees in selected departments will receive the email)"
            data={departmentOptions}
            value={form.values.departmentIds}
            onChange={value => form.setFieldValue('departmentIds', value)}
            searchable
            description="Select entire departments to send emails to all employees"
            leftSection={<IconBuilding size={16} />}
          />

          {/* Individual Employee Selection */}
          <MultiSelect
            label="Individual Employees"
            placeholder="Select specific employees"
            data={employeeOptions}
            value={form.values.employeeIds}
            onChange={value => form.setFieldValue('employeeIds', value)}
            searchable
            description="Select specific employees in addition to departments"
            leftSection={<IconUsers size={16} />}
            error={form.errors.departmentIds}
          />

          {/* Recipient Summary */}
          {(selectedDepartments.length > 0 || selectedEmployees.length > 0) && (
            <Card withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500}>
                  Recipient Summary (~{estimatedRecipientCount} total)
                </Text>

                {selectedDepartments.length > 0 && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      Departments:
                    </Text>
                    <Group gap="xs">
                      {selectedDepartments.map(dept => (
                        <Badge
                          key={dept.id}
                          variant="light"
                          color="blue"
                          leftSection={<IconBuilding size={12} />}
                        >
                          {dept.name} ({dept.employeeCount})
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}

                {selectedEmployees.length > 0 && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      Individual Employees:
                    </Text>
                    <Group gap="xs">
                      {selectedEmployees.slice(0, 10).map(emp => (
                        <Badge
                          key={emp.id}
                          variant="light"
                          color="green"
                          leftSection={<IconUsers size={12} />}
                        >
                          {emp.firstName} {emp.lastName}
                        </Badge>
                      ))}
                      {selectedEmployees.length > 10 && (
                        <Badge variant="light" color="gray">
                          +{selectedEmployees.length - 10} more
                        </Badge>
                      )}
                    </Group>
                  </div>
                )}
              </Stack>
            </Card>
          )}

          {/* Subject Override */}
          <TextInput
            label="Subject Override (Optional)"
            placeholder="Override template subject"
            value={form.values.subject}
            onChange={event =>
              form.setFieldValue('subject', event.currentTarget.value)
            }
            description="Leave empty to use template subject"
          />

          {/* Content Override */}
          <Textarea
            label="Content Override (Optional)"
            placeholder="Override template content"
            value={form.values.customContent}
            onChange={event =>
              form.setFieldValue('customContent', event.currentTarget.value)
            }
            minRows={4}
            autosize
            description="Leave empty to use template content"
          />

          {/* Warning for large sends */}
          {estimatedRecipientCount > 100 && (
            <Alert icon={<IconAlertCircle size={16} />} color="orange">
              <Text size="sm">
                You are about to send emails to {estimatedRecipientCount}{' '}
                recipients. This operation may take several minutes to complete.
                Please ensure all information is correct before proceeding.
              </Text>
            </Alert>
          )}

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            {onCancel && (
              <Button
                variant="light"
                onClick={onCancel}
                disabled={showProgress}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              leftSection={<IconSend size={16} />}
              loading={sendBulkEmailMutation.isPending}
              disabled={estimatedRecipientCount === 0 || showProgress}
            >
              Send to {estimatedRecipientCount} Recipients
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};
