import React from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Anchor,
  Stack,
  Checkbox,
  Alert,
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconAlertCircle } from '@tabler/icons-react';
import { FormField } from '../../../components/ui';
import type { LoginRequest } from '../../../types';

// Validation schema
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  onSubmit: (data: LoginRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error,
  onForgotPassword,
  onRegister,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      await onSubmit({
        username: data.username,
        password: data.password,
      });
      reset();
    } catch (error) {
      // Error handling is done by parent component
      console.error('Login form submission error:', error);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md">
      <Title ta="center" mb="md">
        Welcome back!
      </Title>

      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Sign in to your account to continue
      </Text>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Login Failed"
          color="red"
          mb="md"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack>
          <FormField label="Username" error={errors.username?.message} required>
            <TextInput
              {...register('username')}
              placeholder="Enter your username"
              error={!!errors.username}
              disabled={isLoading}
              data-testid="username-input"
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <PasswordInput
              {...register('password')}
              placeholder="Enter your password"
              error={!!errors.password}
              disabled={isLoading}
              data-testid="password-input"
            />
          </FormField>

          <Checkbox
            {...register('rememberMe')}
            label="Remember me"
            disabled={isLoading}
            data-testid="remember-me-checkbox"
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            data-testid="login-button"
          >
            Sign in
          </Button>
        </Stack>
      </form>

      <Stack mt="md" gap="xs">
        {onForgotPassword && (
          <Text ta="center" size="sm">
            <Anchor
              component="button"
              type="button"
              onClick={onForgotPassword}
              disabled={isLoading}
              data-testid="forgot-password-link"
            >
              Forgot your password?
            </Anchor>
          </Text>
        )}

        {onRegister && (
          <Text ta="center" size="sm">
            Don't have an account?{' '}
            <Anchor
              component="button"
              type="button"
              onClick={onRegister}
              disabled={isLoading}
              data-testid="register-link"
            >
              Sign up
            </Anchor>
          </Text>
        )}
      </Stack>
    </Paper>
  );
};

export default LoginForm;
