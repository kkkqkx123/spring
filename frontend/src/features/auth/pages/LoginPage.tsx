import React from 'react';
import { Container, Center, Box } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants';
import type { LoginRequest } from '../../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  // Get the intended destination from location state, default to dashboard
  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  const handleLogin = async (credentials: LoginRequest) => {
    try {
      await loginMutation.mutateAsync(credentials);

      notifications.show({
        title: 'Login Successful',
        message: 'Welcome back!',
        color: 'green',
      });

      // Navigate to intended destination or dashboard
      navigate(from, { replace: true });
    } catch (error: any) {
      notifications.show({
        title: 'Login Failed',
        message: error.message || 'Invalid credentials. Please try again.',
        color: 'red',
      });
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password page when implemented
    notifications.show({
      title: 'Feature Coming Soon',
      message: 'Password reset functionality will be available soon.',
      color: 'blue',
    });
  };

  const handleRegister = () => {
    navigate(ROUTES.REGISTER);
  };

  return (
    <Container size={420} my={40}>
      <Center>
        <Box w="100%">
          <LoginForm
            onSubmit={handleLogin}
            loading={loginMutation.isPending}
            error={loginMutation.error?.message}
            onForgotPassword={handleForgotPassword}
            onRegister={handleRegister}
          />
        </Box>
      </Center>
    </Container>
  );
};

export default LoginPage;
