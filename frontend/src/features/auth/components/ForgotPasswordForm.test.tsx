import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { beforeEach } from 'node:test';

// Mock the FormField component since it's imported from a relative path
vi.mock('../../../components/ui', () => ({
  FormField: ({ children, label, error }: { children: React.ReactNode; label: string; error?: string }) => (
    <div>
      <label htmlFor="email-input">{label}</label>
      {React.isValidElement(children) ? React.cloneElement(children, { id: 'email-input' } as React.Attributes) : children}
      {error && <span>{error}</span>}
    </div>
  ),
}));

describe('ForgotPasswordForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBackToLogin = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnBackToLogin.mockClear();
  });

  it('renders correctly in initial state', () => {
    render(
      <MantineProvider>
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
        />
      </MantineProvider>
    );

    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByTestId('send-reset-link-button')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login-link')).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted with valid email', async () => {
    render(
      <MantineProvider>
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
        />
      </MantineProvider>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByTestId('send-reset-link-button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Wait for the async onSubmit to be called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows validation error when email is invalid', async () => {
    render(
      <MantineProvider>
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
        />
      </MantineProvider>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByTestId('send-reset-link-button');

    // Clear the input to trigger required validation
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    // Wait for validation to occur
    await screen.findByText('Email is required');
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('shows success message when success prop is true', () => {
    render(
      <MantineProvider>
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          success={true}
          onBackToLogin={mockOnBackToLogin}
        />
      </MantineProvider>
    );

    expect(screen.getByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText('Reset Link Sent')).toBeInTheDocument();
    expect(screen.getByText('We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'Failed to send reset link';
    render(
      <MantineProvider>
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          error={errorMessage}
          onBackToLogin={mockOnBackToLogin}
        />
      </MantineProvider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls onBackToLogin when back to login link is clicked', () => {
    render(
      <MantineProvider>
        <ForgotPasswordForm
          onSubmit={mockOnSubmit}
          onBackToLogin={mockOnBackToLogin}
        />
      </MantineProvider>
    );

    const backButton = screen.getByTestId('back-to-login-link');
    fireEvent.click(backButton);

    expect(mockOnBackToLogin).toHaveBeenCalled();
  });
});