import React from 'react';
import { MantineProvider } from '@mantine/core';
import { LoginForm, RegisterForm, ForgotPasswordForm } from './index';
import type { LoginRequest, RegisterRequest } from '../../../types';

// Simple test component to verify forms render correctly
export const TestAuthForms: React.FC = () => {
  const handleLogin = async (data: LoginRequest) => {
    console.log('Login:', data);
  };

  const handleRegister = async (data: RegisterRequest) => {
    console.log('Register:', data);
  };

  const handleForgotPassword = async (email: string) => {
    console.log('Forgot password:', email);
  };

  return (
    <MantineProvider>
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        <h2>Login Form</h2>
        <LoginForm
          onSubmit={handleLogin}
          onForgotPassword={() => console.log('Forgot password clicked')}
          onRegister={() => console.log('Register clicked')}
        />

        <h2>Register Form</h2>
        <RegisterForm
          onSubmit={handleRegister}
          onLogin={() => console.log('Login clicked')}
        />

        <h2>Forgot Password Form</h2>
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          onBackToLogin={() => console.log('Back to login clicked')}
        />
      </div>
    </MantineProvider>
  );
};

export default TestAuthForms;
