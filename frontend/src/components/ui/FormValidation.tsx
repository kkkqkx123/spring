import React from 'react';
import {
  Text,
  Alert,
  Stack,
  List,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react';
import type { FieldError, FieldErrors } from 'react-hook-form';

interface FormErrorDisplayProps {
  error?: FieldError;
  touched?: boolean;
  showIcon?: boolean;
}

/**
 * Display individual field error with appropriate styling
 */
export const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({
  error,
  touched = true,
  showIcon = true,
}) => {
  if (!error || !touched) return null;

  return (
    <Group gap="xs" align="flex-start" mt="xs">
      {showIcon && (
        <IconAlertCircle
          size={16}
          color="var(--mantine-color-red-6)"
          style={{ marginTop: 2, flexShrink: 0 }}
        />
      )}
      <Text size="sm" c="red">
        {error.message}
      </Text>
    </Group>
  );
};

interface FormSuccessDisplayProps {
  message: string;
  showIcon?: boolean;
}

/**
 * Display success message for form fields
 */
export const FormSuccessDisplay: React.FC<FormSuccessDisplayProps> = ({
  message,
  showIcon = true,
}) => {
  return (
    <Group gap="xs" align="flex-start" mt="xs">
      {showIcon && (
        <IconCheck
          size={16}
          color="var(--mantine-color-green-6)"
          style={{ marginTop: 2, flexShrink: 0 }}
        />
      )}
      <Text size="sm" c="green">
        {message}
      </Text>
    </Group>
  );
};

interface FormErrorSummaryProps {
  errors: FieldErrors;
  title?: string;
  showFieldNames?: boolean;
  onFieldClick?: (fieldName: string) => void;
}

/**
 * Display summary of all form errors
 */
export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = 'Please correct the following errors:',
  showFieldNames = true,
  onFieldClick,
}) => {
  const errorEntries = Object.entries(errors).filter(
    ([_, error]) => error?.message
  );

  if (errorEntries.length === 0) return null;

  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      title={title}
      color="red"
      variant="light"
      mb="md"
    >
      <List size="sm" spacing="xs">
        {errorEntries.map(([fieldName, error]) => (
          <List.Item key={fieldName}>
            <Group gap="xs" align="flex-start">
              {showFieldNames && (
                <Text
                  fw={500}
                  size="sm"
                  style={{
                    cursor: onFieldClick ? 'pointer' : 'default',
                    textDecoration: onFieldClick ? 'underline' : 'none',
                  }}
                  onClick={() => onFieldClick?.(fieldName)}
                >
                  {formatFieldName(fieldName)}:
                </Text>
              )}
              <Text size="sm">{error?.message}</Text>
            </Group>
          </List.Item>
        ))}
      </List>
    </Alert>
  );
};

interface ValidationRulesDisplayProps {
  rules: Array<{
    label: string;
    valid: boolean;
    message?: string;
  }>;
  title?: string;
}

/**
 * Display validation rules with pass/fail indicators
 */
export const ValidationRulesDisplay: React.FC<ValidationRulesDisplayProps> = ({
  rules,
  title = 'Password Requirements:',
}) => {
  return (
    <Stack gap="xs" mt="xs">
      {title && (
        <Text size="sm" fw={500} c="dimmed">
          {title}
        </Text>
      )}
      {rules.map((rule, index) => (
        <Group key={index} gap="xs" align="flex-start">
          {rule.valid ? (
            <IconCheck size={16} color="var(--mantine-color-green-6)" />
          ) : (
            <IconX size={16} color="var(--mantine-color-red-6)" />
          )}
          <Text size="sm" c={rule.valid ? 'green' : 'red'} style={{ flex: 1 }}>
            {rule.label}
          </Text>
          {rule.message && (
            <Tooltip label={rule.message}>
              <ActionIcon variant="subtle" size="xs">
                <IconInfoCircle size={12} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ))}
    </Stack>
  );
};

interface FormFieldWrapperProps {
  children: React.ReactNode;
  error?: FieldError;
  touched?: boolean;
  success?: string;
  validationRules?: Array<{
    label: string;
    valid: boolean;
    message?: string;
  }>;
  showValidationRules?: boolean;
}

/**
 * Wrapper component that combines field with error/success display
 */
export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  children,
  error,
  touched,
  success,
  validationRules,
  showValidationRules = false,
}) => {
  return (
    <Stack gap="xs">
      {children}

      {error && touched && <FormErrorDisplay error={error} touched={touched} />}

      {success && !error && <FormSuccessDisplay message={success} />}

      {showValidationRules && validationRules && (
        <ValidationRulesDisplay rules={validationRules} />
      )}
    </Stack>
  );
};

/**
 * Utility function to format field names for display
 */
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};

/**
 * Hook to validate password strength
 */
export const usePasswordValidation = (password: string) => {
  const rules = React.useMemo(
    () => [
      {
        label: 'At least 8 characters long',
        valid: password.length >= 8,
      },
      {
        label: 'Contains uppercase letter',
        valid: /[A-Z]/.test(password),
      },
      {
        label: 'Contains lowercase letter',
        valid: /[a-z]/.test(password),
      },
      {
        label: 'Contains number',
        valid: /\d/.test(password),
      },
      {
        label: 'Contains special character',
        valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ],
    [password]
  );

  const isValid = rules.every(rule => rule.valid);
  const strength = rules.filter(rule => rule.valid).length;

  return {
    rules,
    isValid,
    strength,
    strengthLabel: getPasswordStrengthLabel(strength),
  };
};

const getPasswordStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Fair';
    case 4:
      return 'Good';
    case 5:
      return 'Strong';
    default:
      return 'Unknown';
  }
};

/**
 * Hook to handle form validation state
 */
export const useFormValidation = () => {
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = React.useState<
    Record<string, string>
  >({});

  const markFieldTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const markAllFieldsTouched = (fieldNames: string[]) => {
    const touchedFields = fieldNames.reduce(
      (acc, name) => {
        acc[name] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    setTouched(touchedFields);
  };

  const setServerError = (fieldName: string, error: string) => {
    setServerErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const clearServerErrors = () => {
    setServerErrors({});
  };

  const clearServerError = (fieldName: string) => {
    setServerErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  return {
    touched,
    serverErrors,
    markFieldTouched,
    markAllFieldsTouched,
    setServerError,
    clearServerErrors,
    clearServerError,
  };
};
