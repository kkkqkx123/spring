import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { FormField } from '../FormField';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('FormField', () => {
  it('renders text input field', () => {
    render(
      <TestWrapper>
        <FormField
          name="username"
          label="Username"
          type="text"
          placeholder="Enter username"
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('renders textarea field', () => {
    render(
      <TestWrapper>
        <FormField
          name="description"
          label="Description"
          type="textarea"
          placeholder="Enter description"
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders select field', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];

    render(
      <TestWrapper>
        <FormField
          name="category"
          label="Category"
          type="select"
          options={options}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('renders checkbox field', () => {
    render(
      <TestWrapper>
        <FormField name="agree" label="I agree to terms" type="checkbox" />
      </TestWrapper>
    );

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('I agree to terms')).toBeInTheDocument();
  });

  it('shows validation error', () => {
    render(
      <TestWrapper>
        <FormField
          name="email"
          label="Email"
          type="email"
          error="Invalid email format"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <TestWrapper>
        <FormField name="email" label="Email" type="email" required />
      </TestWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows help text', () => {
    render(
      <TestWrapper>
        <FormField
          name="password"
          label="Password"
          type="password"
          helpText="Must be at least 8 characters"
        />
      </TestWrapper>
    );

    expect(
      screen.getByText('Must be at least 8 characters')
    ).toBeInTheDocument();
  });

  it('handles input change', async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FormField
          name="username"
          label="Username"
          type="text"
          onChange={mockOnChange}
        />
      </TestWrapper>
    );

    const input = screen.getByLabelText('Username');
    await user.type(input, 'testuser');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('handles checkbox change', async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <FormField
          name="agree"
          label="I agree"
          type="checkbox"
          onChange={mockOnChange}
        />
      </TestWrapper>
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('handles select change', async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];

    render(
      <TestWrapper>
        <FormField
          name="category"
          label="Category"
          type="select"
          options={options}
          onChange={mockOnChange}
        />
      </TestWrapper>
    );

    const select = screen.getByRole('textbox');
    await user.click(select);
    await user.click(screen.getByText('Option 1'));

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('disables field when disabled prop is true', () => {
    render(
      <TestWrapper>
        <FormField name="username" label="Username" type="text" disabled />
      </TestWrapper>
    );

    const input = screen.getByLabelText('Username');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <FormField
          name="username"
          label="Username"
          type="text"
          className="custom-field"
        />
      </TestWrapper>
    );

    const fieldContainer = screen
      .getByLabelText('Username')
      .closest('.custom-field');
    expect(fieldContainer).toBeInTheDocument();
  });

  it('renders with default value', () => {
    render(
      <TestWrapper>
        <FormField
          name="username"
          label="Username"
          type="text"
          defaultValue="defaultuser"
        />
      </TestWrapper>
    );

    const input = screen.getByDisplayValue('defaultuser');
    expect(input).toBeInTheDocument();
  });
});
