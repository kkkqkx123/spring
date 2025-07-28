import React, { useMemo } from 'react';
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
  Progress,
  Box,
  Group,
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { FormField } from '../../../components/ui';
import type { RegisterRequest } from '../../../types';

// Password strength requirements
const passwordRequirements = [
  { re: /.{8,}/, label: 'At least 8 characters' },
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

// Validation schema
const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(
        /[$&+,:;=?@#|'<>.^*()%!-]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  onSubmit: (data: RegisterRequest) => Promise<void>;
  loading?: boolean;
  error?: string;
  onLogin?: () => void;
}

// Password strength indicator component
interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const strength = useMemo(() => {
    const requirements = passwordRequirements.map((requirement) => ({
      ...requirement,
      met: requirement.re.test(password),
    }));

    const score = requirements.filter((req) => req.met).length;
    return { requirements, score };
  }, [password]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'red';
    if (score < 3) return 'red';
    if (score < 4) return 'yellow';
    if (score < 5) return 'orange';
    return 'teal';
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return 'Very weak';
    if (score < 3) return 'Weak';
    if (score < 4) return 'Fair';
    if (score < 5) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <Box>
      <Group justify="space-between" mb={5}>
        <Text size="sm" fw={500}>
          Password strength
        </Text>
        <Text size="sm" c={getStrengthColor(strength.score)}>
          {getStrengthLabel(strength.score)}
        </Text>
      </Group>

      <Progress
        value={(strength.score / passwordRequirements.length) * 100}
        color={getStrengthColor(strength.score)}
        size="sm"
        mb="xs"
      />

      <Stack gap={2}>
        {strength.requirements.map((requirement, index) => (
          <Text
            key={index}
            size="xs"
            c={requirement.met ? 'teal' : 'dimmed'}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {requirement.met ? (
              <IconCheck size={12} color="var(--mantine-color-teal-6)" />
            ) : (
              <IconX size={12} color="var(--mantine-color-dimmed)" />
            )}
            {requirement.label}
          </Text>
        ))}
      </Stack>
    </Box>
  );
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error,
  onLogin,
}) => {


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password');

  const handleFormSubmit = async (data: RegisterFormData) => {
    try {
      await onSubmit({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      reset();
    } catch (error) {
      // Error handling is done by parent component
      console.error('Register form submission error:', error);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md">
      <Title ta="center" mb="md">
        Create Account
      </Title>
      
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Join us today and get started
      </Text>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Registration Failed"
          color="red"
          mb="md"
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack>
          <Group grow>
            <FormField
              label="First Name"
              error={errors.firstName?.message}
              required
            >
              <TextInput
                {...register('firstName')}
                placeholder="Enter your first name"
                error={!!errors.firstName}
                disabled={isLoading}
                data-testid="first-name-input"
              />
            </FormField>

            <FormField
              label="Last Name"
              error={errors.lastName?.message}
              required
            >
              <TextInput
                {...register('lastName')}
                placeholder="Enter your last name"
                error={!!errors.lastName}
                disabled={isLoading}
                data-testid="last-name-input"
              />
            </FormField>
          </Group>

          <FormField
            label="Username"
            error={errors.username?.message}
            required
          >
            <TextInput
              {...register('username')}
              placeholder="Choose a username"
              error={!!errors.username}
              disabled={isLoading}
              data-testid="username-input"
            />
          </FormField>

          <FormField
            label="Email"
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

          <FormField
            label="Password"
            error={errors.password?.message}
            required
          >
            <PasswordInput
              {...register('password')}
              placeholder="Create a strong password"
              error={!!errors.password}
              disabled={isLoading}
              data-testid="password-input"
            />
          </FormField>

          {watchedPassword && (
            <PasswordStrength password={watchedPassword} />
          )}

          <FormField
            label="Confirm Password"
            error={errors.confirmPassword?.message}
            required
          >
            <PasswordInput
              {...register('confirmPassword')}
              placeholder="Confirm your password"
              error={!!errors.confirmPassword}
              disabled={isLoading}
              data-testid="confirm-password-input"
            />
          </FormField>

          <FormField label="" error={errors.acceptTerms?.message}>
            <Checkbox
              {...register('acceptTerms')}
              label={
                <Text size="sm">
                  I accept the{' '}
                  <Anchor href="/terms" target="_blank">
                    Terms and Conditions
                  </Anchor>{' '}
                  and{' '}
                  <Anchor href="/privacy" target="_blank">
                    Privacy Policy
                  </Anchor>
                </Text>
              }
              error={!!errors.acceptTerms}
              disabled={isLoading}
              data-testid="accept-terms-checkbox"
            />
          </FormField>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            data-testid="register-button"
          >
            Create Account
          </Button>
        </Stack>
      </form>

      {onLogin && (
        <Text ta="center" size="sm" mt="md">
          Already have an account?{' '}
          <Anchor
            component="button"
            type="button"
            onClick={onLogin}
            disabled={isLoading}
            data-testid="login-link"
          >
            Sign in
          </Anchor>
        </Text>
      )}
    </Paper>
  );
};

export default RegisterForm;