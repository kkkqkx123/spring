/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { LoginForm } from './LoginForm';
import type { LoginFormProps } from './LoginForm';

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

const renderWithProvider = (props: LoginFormProps) => {
  return render(
    <MantineProvider>
      <LoginForm {...props} />
    </MantineProvider>
  );
};

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnForgotPassword = vi.fn();
  const mockOnRegister = vi.fn();

  const defaultProps: LoginFormProps = {
    onSubmit: mockOnSubmit,
    onForgotPassword: mockOnForgotPassword,
    onRegister: mockOnRegister,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required elements', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(
        screen.getByText('Sign in to your account to continue')
      ).toBeInTheDocument();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('remember-me-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    it('should render forgot password link when onForgotPassword is provided', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });

    it('should not render forgot password link when onForgotPassword is not provided', () => {
      const props = { ...defaultProps, onForgotPassword: undefined };
      renderWithProvider(props);

      expect(
        screen.queryByTestId('forgot-password-link')
      ).not.toBeInTheDocument();
    });

    it('should render register link when onRegister is provided', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByTestId('register-link')).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    it('should not render register link when onRegister is not provided', () => {
      const props = { ...defaultProps, onRegister: undefined };
      renderWithProvider(props);

      expect(screen.queryByTestId('register-link')).not.toBeInTheDocument();
    });

    it('should display error alert when error prop is provided', () => {
      const props = { ...defaultProps, error: 'Invalid credentials' };
      renderWithProvider(props);

      expect(screen.getByText('Login Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should show loading state when loading prop is true', () => {
      const props = { ...defaultProps, loading: true };
      renderWithProvider(props);

      const loginButton = screen.getByTestId('login-button');
      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox');

      expect(loginButton).toBeDisabled();
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(rememberMeCheckbox).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty username', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for short username', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      await user.type(usernameInput, 'ab');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText('Username must be at least 3 characters')
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for empty password', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      await user.type(usernameInput, 'testuser');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, '12345');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters')
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not show validation errors for valid input', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });

      expect(
        screen.queryByText('Username is required')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Password is required')
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId(
        'username-input'
      ) as HTMLInputElement;
      const passwordInput = screen.getByTestId(
        'password-input'
      ) as HTMLInputElement;

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Wait for form reset
      await waitFor(() => {
        expect(usernameInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Login form submission error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>(resolve => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValueOnce(submitPromise);

      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      // Form should be disabled during submission
      expect(loginButton).toBeDisabled();
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();

      // Resolve the promise to complete submission
      resolveSubmit!();
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should handle remember me checkbox', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const rememberMeCheckbox = screen.getByTestId('remember-me-checkbox');

      // Initially unchecked
      expect(rememberMeCheckbox).not.toBeChecked();

      // Check the checkbox
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      // Uncheck the checkbox
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });
  });

  describe('User Interactions', () => {
    it('should call onForgotPassword when forgot password link is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const forgotPasswordLink = screen.getByTestId('forgot-password-link');
      await user.click(forgotPasswordLink);

      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });

    it('should call onRegister when register link is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const registerLink = screen.getByTestId('register-link');
      await user.click(registerLink);

      expect(mockOnRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProvider(defaultProps);

      expect(screen.getByText('Username *')).toBeInTheDocument();
      expect(screen.getByText('Password *')).toBeInTheDocument();
    });

    it('should have proper button text', () => {
      renderWithProvider(defaultProps);

      expect(
        screen.getByRole('button', { name: 'Sign in' })
      ).toBeInTheDocument();
    });

    it('should have proper error announcements', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('should have proper input placeholders', () => {
      renderWithProvider(defaultProps);

      expect(
        screen.getByPlaceholderText('Enter your username')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your password')
      ).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('should accept valid username formats', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      const validUsernames = [
        'testuser',
        'user123',
        'test_user',
        'test-user',
        'TestUser',
      ];

      for (const username of validUsernames) {
        await user.clear(usernameInput);
        await user.clear(passwordInput);
        await user.type(usernameInput, username);
        await user.type(passwordInput, 'password123');

        const loginButton = screen.getByTestId('login-button');
        await user.click(loginButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith({
            username,
            password: 'password123',
          });
        });

        mockOnSubmit.mockClear();
      }
    });

    it('should handle password input correctly', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'mySecretPassword123!');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'mySecretPassword123!',
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace in username', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, '  testuser  ');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: '  testuser  ',
          password: 'password123',
        });
      });
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      renderWithProvider(defaultProps);

      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'P@ssw0rd!#$%');

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'P@ssw0rd!#$%',
        });
      });
    });
  });
});
