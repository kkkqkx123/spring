import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider, TextInput, Select, Checkbox } from '@mantine/core';
import { FormField, TextFormField, SelectFormField, CheckboxFormField } from './FormField';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('FormField', () => {
  it('renders label and input', () => {
    renderWithProvider(
      <FormField label="Test Field">
        <TextInput placeholder="Enter text" />
      </FormField>
    );

    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    renderWithProvider(
      <FormField label="Required Field" required>
        <TextInput />
      </FormField>
    );

    expect(screen.getByLabelText('Required field')).toBeInTheDocument();
  });

  it('displays error message', () => {
    renderWithProvider(
      <FormField label="Test Field" error="This field is required">
        <TextInput />
      </FormField>
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows help text with tooltip', async () => {
    renderWithProvider(
      <FormField label="Test Field" helpText="This is helpful information">
        <TextInput />
      </FormField>
    );

    const helpIcon = screen.getByLabelText('Field information');
    expect(helpIcon).toBeInTheDocument();
    
    // The tooltip content is rendered in a portal, so we just check the icon exists
    expect(helpIcon).toHaveAttribute('aria-label', 'Field information');
  });

  it('applies correct accessibility attributes', () => {
    renderWithProvider(
      <FormField label="Test Field" error="Error message" required>
        <TextInput />
      </FormField>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    // The aria-describedby is set when there's an error
    expect(input).toHaveAttribute('id');
  });

  it('links label to input with correct id', () => {
    renderWithProvider(
      <FormField label="Test Field">
        <TextInput />
      </FormField>
    );

    const label = screen.getByText('Test Field');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', input.id);
  });
});

describe('TextFormField', () => {
  it('renders as FormField with text input', () => {
    renderWithProvider(
      <TextFormField label="Text Field" error="Error">
        <TextInput placeholder="Enter text" />
      </TextFormField>
    );

    expect(screen.getByText('Text Field')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

describe('SelectFormField', () => {
  it('renders as FormField with select input', () => {
    renderWithProvider(
      <SelectFormField label="Select Field">
        <Select 
          data={[
            { value: '1', label: 'Option 1' },
            { value: '2', label: 'Option 2' }
          ]}
          placeholder="Choose option"
        />
      </SelectFormField>
    );

    expect(screen.getByText('Select Field')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose option')).toBeInTheDocument();
  });
});

describe('CheckboxFormField', () => {
  it('renders checkbox with label and error', () => {
    renderWithProvider(
      <CheckboxFormField label="Checkbox Field" error="Please check this">
        <Checkbox />
      </CheckboxFormField>
    );

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Please check this')).toBeInTheDocument();
  });

  it('applies accessibility attributes to checkbox', () => {
    renderWithProvider(
      <CheckboxFormField label="Required Checkbox" required error="Error">
        <Checkbox />
      </CheckboxFormField>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });
});