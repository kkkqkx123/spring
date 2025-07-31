import React from 'react';
import {
  Alert,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  List,
  Card,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { useValidateVariables } from '../hooks/useEmail';
import type { EmailTemplate } from '../../../types';

interface EmailValidationProps {
  template: EmailTemplate;
  variables: Record<string, string>;
  recipients: Array<{ id: number; name: string; email: string }>;
  onValidationChange?: (isValid: boolean) => void;
}

interface ValidationResult {
  valid: boolean;
  missingVariables: string[];
  invalidVariables: string[];
  recipientErrors: string[];
  subjectErrors: string[];
  contentErrors: string[];
}

export const EmailValidation: React.FC<EmailValidationProps> = ({
  template,
  variables,
  recipients,
  onValidationChange,
}) => {
  const validateVariablesMutation = useValidateVariables();
  const [validationResult, setValidationResult] =
    React.useState<ValidationResult | null>(null);

  // Perform client-side validation
  const performClientValidation = React.useCallback((): ValidationResult => {
    const result: ValidationResult = {
      valid: true,
      missingVariables: [],
      invalidVariables: [],
      recipientErrors: [],
      subjectErrors: [],
      contentErrors: [],
    };

    // Check required variables
    template.variables.forEach(variable => {
      if (!variables[variable] || variables[variable].trim() === '') {
        result.missingVariables.push(variable);
        result.valid = false;
      }
    });

    // Check recipients
    if (recipients.length === 0) {
      result.recipientErrors.push('At least one recipient is required');
      result.valid = false;
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    recipients.forEach(recipient => {
      if (!emailRegex.test(recipient.email)) {
        result.recipientErrors.push(
          `Invalid email address: ${recipient.email}`
        );
        result.valid = false;
      }
    });

    // Check subject
    if (!template.subject || template.subject.trim() === '') {
      result.subjectErrors.push('Subject is required');
      result.valid = false;
    }

    // Check content
    if (!template.content || template.content.trim() === '') {
      result.contentErrors.push('Content is required');
      result.valid = false;
    }

    return result;
  }, [template, variables, recipients]);

  // Perform server-side validation
  const performServerValidation = async () => {
    try {
      const serverResult = await validateVariablesMutation.mutateAsync({
        templateId: template.id,
        variables,
      });

      const clientResult = performClientValidation();

      const combinedResult: ValidationResult = {
        ...clientResult,
        valid: clientResult.valid && serverResult.valid,
        missingVariables: [
          ...new Set([
            ...clientResult.missingVariables,
            ...(serverResult.missingVariables || []),
          ]),
        ],
        invalidVariables: [
          ...new Set([
            ...clientResult.invalidVariables,
            ...(serverResult.invalidVariables || []),
          ]),
        ],
      };

      setValidationResult(combinedResult);
      onValidationChange?.(combinedResult.valid);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const clientResult = performClientValidation();
      setValidationResult({
        ...clientResult,
        valid: false,
        contentErrors: [
          ...clientResult.contentErrors,
          'Server validation failed',
        ],
      });
      onValidationChange?.(false);
    }
  };

  // Auto-validate when dependencies change
  React.useEffect(() => {
    const clientResult = performClientValidation();
    setValidationResult(clientResult);
    onValidationChange?.(clientResult.valid);
  }, [performClientValidation, onValidationChange]);

  const hasErrors = validationResult && !validationResult.valid;

  return (
    <Stack gap="sm">
      {/* Validation Summary */}
      <Card withBorder>
        <Group justify="space-between">
          <Group gap="sm">
            {validationResult?.valid ? (
              <Badge color="green" leftSection={<IconCheck size={12} />}>
                Valid
              </Badge>
            ) : (
              <Badge color="red" leftSection={<IconX size={12} />}>
                Invalid
              </Badge>
            )}
            <Text size="sm">
              {recipients.length} recipient(s), {template.variables.length}{' '}
              variable(s)
            </Text>
          </Group>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconRefresh size={14} />}
            onClick={performServerValidation}
            loading={validateVariablesMutation.isPending}
          >
            Validate
          </Button>
        </Group>
      </Card>

      {/* Error Messages */}
      {hasErrors && (
        <Stack gap="xs">
          {/* Missing Variables */}
          {validationResult.missingVariables.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Missing Required Variables
                </Text>
                <List size="sm">
                  {validationResult.missingVariables.map(variable => (
                    <List.Item key={variable}>{variable}</List.Item>
                  ))}
                </List>
              </Stack>
            </Alert>
          )}

          {/* Invalid Variables */}
          {validationResult.invalidVariables.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="orange">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Invalid Variables
                </Text>
                <List size="sm">
                  {validationResult.invalidVariables.map(variable => (
                    <List.Item key={variable}>{variable}</List.Item>
                  ))}
                </List>
              </Stack>
            </Alert>
          )}

          {/* Recipient Errors */}
          {validationResult.recipientErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Recipient Issues
                </Text>
                <List size="sm">
                  {validationResult.recipientErrors.map((error, index) => (
                    <List.Item key={index}>{error}</List.Item>
                  ))}
                </List>
              </Stack>
            </Alert>
          )}

          {/* Subject Errors */}
          {validationResult.subjectErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Subject Issues
                </Text>
                <List size="sm">
                  {validationResult.subjectErrors.map((error, index) => (
                    <List.Item key={index}>{error}</List.Item>
                  ))}
                </List>
              </Stack>
            </Alert>
          )}

          {/* Content Errors */}
          {validationResult.contentErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Content Issues
                </Text>
                <List size="sm">
                  {validationResult.contentErrors.map((error, index) => (
                    <List.Item key={index}>{error}</List.Item>
                  ))}
                </List>
              </Stack>
            </Alert>
          )}
        </Stack>
      )}

      {/* Success Message */}
      {validationResult?.valid && (
        <Alert icon={<IconCheck size={16} />} color="green">
          <Text size="sm">
            Email is ready to send! All variables are properly filled and
            recipients are valid.
          </Text>
        </Alert>
      )}

      {/* Validation Details */}
      {validationResult && (
        <Card withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Validation Details
            </Text>
            <Group gap="md">
              <div>
                <Text size="xs" c="dimmed">
                  Recipients
                </Text>
                <Text size="sm">{recipients.length}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Variables
                </Text>
                <Text size="sm">
                  {Object.keys(variables).length} / {template.variables.length}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Status
                </Text>
                <Badge
                  size="sm"
                  color={validationResult.valid ? 'green' : 'red'}
                >
                  {validationResult.valid ? 'Ready' : 'Needs Attention'}
                </Badge>
              </div>
            </Group>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
