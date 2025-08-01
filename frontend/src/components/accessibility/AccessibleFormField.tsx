import React from 'react';
import { TextInput, type TextInputProps, Text, Box } from '@mantine/core';
import { useAccessibleFormField } from '../../utils/accessibility';

interface AccessibleFormFieldProps
  extends Omit<TextInputProps, 'id' | 'label'> {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  error,
  description,
  required = false,
  ...inputProps
}) => {
  const { fieldProps, labelProps, errorProps, descriptionProps } =
    useAccessibleFormField(id, label, required, error, description);

  return (
    <Box>
      <label {...labelProps}>
        <Text size="sm" fw={500} mb="xs">
          {label}
          {required && (
            <Text component="span" c="red" ml={4} aria-label="required">
              *
            </Text>
          )}
        </Text>
      </label>

      {description && (
        <Text {...descriptionProps} size="xs" c="dimmed" mb="xs">
          {description}
        </Text>
      )}

      <TextInput
        {...inputProps}
        {...fieldProps}
        error={!!error}
        styles={(theme, props, ctx) => {
          const baseStyles =
            typeof inputProps.styles === 'function'
              ? inputProps.styles(theme, props, ctx)
              : inputProps.styles;

          return {
            ...baseStyles,
            input: {
              ...(baseStyles?.input as object),
              // Enhanced focus styles
              '&:focus': {
                borderColor: 'var(--mantine-color-blue-6)',
                boxShadow: '0 0 0 2px var(--mantine-color-blue-2)',
              },
              // High contrast mode support
              '@media (prefers-contrast: high)': {
                border: '2px solid currentColor',
              },
              // Error state styling
              ...(error && {
                borderColor: 'var(--mantine-color-red-6)',
                '&:focus': {
                  borderColor: 'var(--mantine-color-red-6)',
                  boxShadow: '0 0 0 2px var(--mantine-color-red-2)',
                },
              }),
            },
          };
        }}
      />

      {error && (
        <Text {...errorProps} size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </Box>
  );
};
