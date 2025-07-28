import React from 'react';
import {
  TextInput,
  Button,
  Paper,
  Title,
  Text,
  Anchor,
  Stack,
  Alert,
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { FormField } from '../../../components/ui';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  success?: boolean;
  onBackToLogin?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  loading = false,
  error,
  success = false,
  onBackToLogin,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await onSubmit(data.email);
      reset();
    } catch (error) {
      // Error handling is done by parent component
      console.error('Forgot password form submission error:', error);
    }
  };

  const isLoading = loading || isSubmitting;

  if (success) {
    return (
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center" mb="md">
          Check Your Email
        </Title>

        <Alert
          icon={<IconCheck size="1rem" />}
          title="Reset Link Sent"
          color="green"
          mb="md"
        >
          We've sent a password reset link to your email address. Please check
          your inbox and follow the instructions to reset your password.
        </Alert>

        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Didn't receive the email? Check your spam folder or try again.
        </Text>

        <Stack>
          <Button
            variant="outline"
            fullWidth
            onClick={() => window.location.reload()}
            data-testid="try-again-button"
          >
            Try Again
          </Button>

          {onBackToLogin && (
            <Button
              variant="subtle"
              fullWidth
              onClick={onBackToLogin}
              data-testid="back-to-login-button"
            >
              Back to Login
            </Button>
          )}
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md">
      <Title ta="center" mb="md">
        Forgot Password?
      </Title>
      
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack>
          <FormField
            label="Email Address"
            error={errors.email?.message}
            required
          >
            <TextInput
              {...register('email')}
              type="email"
              placeholder="Enter your email address"
              error={!!errors.email}
              disabled={isLoading}
              data-testid="email-input"
            />
          </FormField>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            data-testid="send-reset-link-button"
          >
            Send Reset Link
          </Button>
        </Stack>
      </form>

      {onBackToLogin && (
        <Text ta="center" size="sm" mt="md">
          Remember your password?{' '}
          <Anchor
            component="button"
            type="button"
            onClick={onBackToLogin}
            disabled={isLoading}
            data-testid="back-to-login-link"
          >
            Back to Login
          </Anchor>
        </Text>
      )}
    </Paper>
  );
};

export default ForgotPasswordForm;