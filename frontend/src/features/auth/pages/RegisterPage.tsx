import React from 'react';
import { Container, Center, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { RegisterForm } from '../components/RegisterForm';
import { useRegister } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants';
import type { RegisterRequest } from '../../../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleRegister = async (userData: RegisterRequest) => {
    try {
      await registerMutation.mutateAsync(userData);

      notifications.show({
        title: 'Registration Successful',
        message: 'Your account has been created. Please log in to continue.',
        color: 'green',
      });

      // Navigate to login page after successful registration
      navigate(ROUTES.LOGIN);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.';
      notifications.show({
        title: 'Registration Failed',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  const handleLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <Container size={420} my={40}>
      <Center>
        <Box w="100%">
          <RegisterForm
            onSubmit={handleRegister}
            loading={registerMutation.isPending}
            error={registerMutation.error?.message}
            onLogin={handleLogin}
          />
        </Box>
      </Center>
    </Container>
  );
};

export default RegisterPage;
