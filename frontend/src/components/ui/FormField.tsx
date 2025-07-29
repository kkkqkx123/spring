import React from 'react';
import { Box, Text, Group, Tooltip } from '@mantine/core';
import { IconInfoCircle, IconAsterisk } from '@tabler/icons-react';
import { FormFieldProps } from '../../types';

export function FormField({
  label,
  error,
  required = false,
  children,
  helpText,
  ...props
}: FormFieldProps & { helpText?: string }) {
  const fieldId = React.useId();

  return (
    <Box {...props}>
      {/* Label */}
      <Group gap="xs" mb="xs">
        <Text
          component="label"
          htmlFor={fieldId}
          size="sm"
          fw={500}
          c={error ? 'red' : undefined}
        >
          {label}
        </Text>

        {required && (
          <IconAsterisk
            size={8}
            color="var(--mantine-color-red-6)"
            aria-label="Required field"
          />
        )}

        {helpText && (
          <Tooltip label={helpText} position="top" withArrow>
            <IconInfoCircle
              size={14}
              color="var(--mantine-color-gray-6)"
              style={{ cursor: 'help' }}
              aria-label="Field information"
            />
          </Tooltip>
        )}
      </Group>

      {/* Input Field */}
      <Box>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          error: !!error,
          'aria-describedby': error ? `${fieldId}-error` : undefined,
          'aria-required': required,
          'aria-invalid': !!error,
        })}
      </Box>

      {/* Error Message */}
      {error && (
        <Text
          id={`${fieldId}-error`}
          size="sm"
          c="red"
          mt="xs"
          role="alert"
          aria-live="polite"
        >
          {error}
        </Text>
      )}
    </Box>
  );
}

// Specialized form field variants for common use cases
export function TextFormField({
  label,
  error,
  required,
  helpText,
  children,
  ...props
}: FormFieldProps & { helpText?: string }) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      helpText={helpText}
      {...props}
    >
      {children}
    </FormField>
  );
}

export function SelectFormField({
  label,
  error,
  required,
  helpText,
  children,
  ...props
}: FormFieldProps & { helpText?: string }) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      helpText={helpText}
      {...props}
    >
      {children}
    </FormField>
  );
}

export function CheckboxFormField({
  label,
  error,
  required,
  helpText,
  children,
  ...props
}: FormFieldProps & { helpText?: string }) {
  return (
    <Box {...props}>
      {React.cloneElement(children as React.ReactElement, {
        label,
        error: !!error,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': error ? `${React.useId()}-error` : undefined,
      })}

      {error && (
        <Text size="sm" c="red" mt="xs" role="alert" aria-live="polite">
          {error}
        </Text>
      )}
    </Box>
  );
}
