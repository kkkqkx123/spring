import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { RegisterForm } from './RegisterForm';
import type { RegisterFormProps } from './RegisterForm';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the FormField component
vi.mock('../../../components/ui', () => ({
  FormField: ({ children, label, error, required }: any) => (
    <div>
      <label>
        {label}
        {required && ' *'}
      </label>
      {children}
      {error && <div role="alert">{error}</div>}
    </div>
  ),
}));

const renderWithProvider = (props: RegisterFormProps) => {
  return render(
    <MantineProvider>
      <RegisterForm {...props} />
    </MantineProvider>
  );
};

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnLogin = vi.fn();

  const defaultProps: RegisterFormProps = {
    onSubmit: mockOnSubmit,
    onLogin: mockOnLogin,
  };

  const validFormData = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render registration form with all required fields', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByText('Join us today and get started')).toBeInTheDocument();
      expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('accept-terms-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('register-button')).toBeInTheDocument();
    });

    it('should render login link when onLogin is provided', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByTestId('login-link')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('should not render login link when onLogin is not provided', () => {
      const props = { ...defaultProps, onLogin: undefined };
      renderWithProvider(props);

      expect(screen.queryByTestId('login-link')).not.toBeInTheDocument();
    });

    it('should display error alert when error prop is provided', () => {
      const props = { ...defaultProps, error: 'Registration failed' };
      renderWithProvider(props);

      expect(screen.getByText('Registration Failed')).toBeInTheDocument();
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });

    it('should show loading state when loading prop is true', () => {
      const props = { ...defaultProps, loading: true };
      renderWithProvider(props);

      const registerButton = screen.getByTestId('register-button');
      expect(registerButton).toBeDisabled();
      
      const inputs = [
        'first-name-input',
        'last-name-input',
        'username-input',
        'email-input',
        'password-input',
        'confirm-password-input',
      ];

      inputs.forEach(inputTestId => {
        expect(screen.getByTestId(inputTestId)).toBeDisabled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
        expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'invalid-email');

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate username format', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      await user.type(usernameInput, 'invalid username!');

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Username can only contain letters, numbers, underscores, and hyphens')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate password requirements', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'weak');

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate field length limits', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const longString = 'a'.repeat(51);
      const firstNameInput = screen.getByTestId('first-name-input');
      await user.type(firstNameInput, longString);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('First name must be less than 50 characters')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show password strength indicator when password is entered', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'Password123!');

      await waitFor(() => {
        expect(screen.getByText('Password strength')).toBeInTheDocument();
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });

    it('should show weak password strength for simple passwords', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'password');

      await waitFor(() => {
        expect(screen.getByText('Password strength')).toBeInTheDocument();
        expect(screen.getByText('Weak')).toBeInTheDocument();
      });
    });

    it('should show password requirements with check marks', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const passwordInput = screen.getByTestId('password-input');
      await user.type(passwordInput, 'Password123!');

      await waitFor(() => {
        expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
        expect(screen.getByText('Includes number')).toBeInTheDocument();
        expect(screen.getByText('Includes lowercase letter')).toBeInTheDocument();
        expect(screen.getByText('Includes uppercase letter')).toBeInTheDocument();
        expect(screen.getByText('Includes special symbol')).toBeInTheDocument();
      });
    });

    it('should not show password strength indicator when password is empty', () => {
      renderWithProvider(defaultProps);

      expect(screen.queryByText('Password strength')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = async (user: any) => {
      await user.type(screen.getByTestId('first-name-input'), validFormData.firstName);
      await user.type(screen.getByTestId('last-name-input'), validFormData.lastName);
      await user.type(screen.getByTestId('username-input'), validFormData.username);
      await user.type(screen.getByTestId('email-input'), validFormData.email);
      await user.type(screen.getByTestId('password-input'), validFormData.password);
      await user.type(screen.getByTestId('confirm-password-input'), validFormData.confirmPassword);
      await user.click(screen.getByTestId('accept-terms-checkbox'));
    };

    it('should call onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      await fillValidForm(user);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          firstName: validFormData.firstName,
          lastName: validFormData.lastName,
          username: validFormData.username,
          email: validFormData.email,
          password: validFormData.password,
        });
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);
      renderWithProvider(defaultProps);

      await fillValidForm(user);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Wait for form reset
      await waitFor(() => {
        const firstNameInput = screen.getByTestId('first-name-input') as HTMLInputElement;
        expect(firstNameInput.value).toBe('');
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProvider(defaultProps);

      await fillValidForm(user);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Register form submission error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValueOnce(submitPromise);

      renderWithProvider(defaultProps);

      await fillValidForm(user);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      // Form should be disabled during submission
      expect(registerButton).toBeDisabled();
      expect(screen.getByTestId('first-name-input')).toBeDisabled();

      // Resolve the promise to complete submission
      resolveSubmit!();
      await waitFor(() => {
        expect(registerButton).not.toBeDisabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onLogin when login link is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const loginLink = screen.getByTestId('login-link');
      await user.click(loginLink);

      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });

    it('should handle terms and conditions checkbox', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const termsCheckbox = screen.getByTestId('accept-terms-checkbox');
      
      expect(termsCheckbox).not.toBeChecked();
      
      await user.click(termsCheckbox);
      expect(termsCheckbox).toBeChecked();
      
      await user.click(termsCheckbox);
      expect(termsCheckbox).not.toBeChecked();
    });

    it('should have links to terms and privacy policy', () => {
      renderWithProvider(defaultProps);

      const termsLink = screen.getByRole('link', { name: 'Terms and Conditions' });
      const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });

      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(termsLink).toHaveAttribute('target', '_blank');
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByText('First Name *')).toBeInTheDocument();
      expect(screen.getByText('Last Name *')).toBeInTheDocument();
      expect(screen.getByText('Username *')).toBeInTheDocument();
      expect(screen.getByText('Email *')).toBeInTheDocument();
      expect(screen.getByText('Password *')).toBeInTheDocument();
      expect(screen.getByText('Confirm Password *')).toBeInTheDocument();
    });

    it('should have proper button text', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('should have proper error announcements', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const registerButton = screen.getByTestId('register-button');
      await user.click(registerButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
        expect(errorMessages[0]).toHaveTextContent('First name is required');
      });
    });
  });
});