import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { EmailComposer } from '../EmailComposer';
import type { EmailTemplate, EmailRecipient } from '../../../../types';

// Mock the API
vi.mock('../../services/emailApi');

// Mock the hooks
vi.mock('../../hooks/useEmail');
vi.mock('../../../departments/hooks/useDepartments');

// Mock data
const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Welcome Template',
    subject: 'Welcome to {{company}}',
    content: 'Hello {{name}}, welcome to {{company}}!',
    variables: ['name', 'company'],
    description: 'Welcome new employees',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Meeting Reminder',
    subject: 'Meeting Reminder: {{meeting_title}}',
    content:
      "Don't forget about the meeting: {{meeting_title}} at {{meeting_time}}",
    variables: ['meeting_title', 'meeting_time'],
    description: 'Remind about meetings',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockRecipients: EmailRecipient[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    type: 'individual',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    type: 'individual',
  },
  {
    id: 3,
    name: 'Engineering Department',
    email: 'engineering@example.com',
    type: 'department',
  },
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

// Mock the hooks
const mockUseEmailTemplates = vi.fn();
const mockUseEmailTemplate = vi.fn();
const mockUseEmailRecipients = vi.fn();
const mockUseSendEmail = vi.fn();
const mockUseTemplatePreview = vi.fn();
const mockUseValidateVariables = vi.fn();
const mockUseDepartments = vi.fn();

vi.mock('../../hooks/useEmail', () => ({
  useEmailTemplates: () => mockUseEmailTemplates(),
  useEmailTemplate: () => mockUseEmailTemplate(),
  useEmailRecipients: () => mockUseEmailRecipients(),
  useSendEmail: () => mockUseSendEmail(),
  useTemplatePreview: () => mockUseTemplatePreview(),
  useValidateVariables: () => mockUseValidateVariables(),
}));

vi.mock('../../../departments/hooks/useDepartments', () => ({
  useDepartments: () => mockUseDepartments(),
}));

describe('EmailComposer', () => {
  const mockOnSent = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseEmailTemplates.mockReturnValue({
      data: mockTemplates || [],
      isLoading: false,
    });

    mockUseEmailTemplate.mockReturnValue({
      data: null,
    });

    mockUseEmailRecipients.mockReturnValue({
      data: mockRecipients || [],
      isLoading: false,
    });

    mockUseSendEmail.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseTemplatePreview.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseValidateVariables.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        valid: true,
        missingVariables: [],
        invalidVariables: [],
      }),
      isPending: false,
    });

    mockUseDepartments.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it('renders email composer form', () => {
    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByText('Compose Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/email template/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recipients/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send email/i })
    ).toBeInTheDocument();
  });

  it('loads and displays email templates', () => {
    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const templateSelect = screen.getByLabelText(/email template/i);
    fireEvent.click(templateSelect);

    expect(screen.getByText('Welcome Template')).toBeInTheDocument();
    expect(screen.getByText('Meeting Reminder')).toBeInTheDocument();
  });

  it('loads and displays recipients', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const recipientsSelect = screen.getByLabelText(/recipients/i);
    await user.click(recipientsSelect);

    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    expect(screen.getByText(/engineering department/i)).toBeInTheDocument();
  });

  it('updates form when template is selected', async () => {
    const user = userEvent.setup();

    mockUseEmailTemplate.mockReturnValue({
      data: mockTemplates[0],
    });

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const templateSelect = screen.getByLabelText(/email template/i);
    await user.click(templateSelect);
    await user.click(screen.getByText('Welcome Template'));

    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Welcome to {{company}}')
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Hello {{name}}, welcome to {{company}}!')
      ).toBeInTheDocument();
    });
  });

  it('shows template variables when template is selected', async () => {
    const user = userEvent.setup();

    mockUseEmailTemplate.mockReturnValue({
      data: mockTemplates[0],
    });

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const templateSelect = screen.getByLabelText(/email template/i);
    await user.click(templateSelect);
    await user.click(screen.getByText('Welcome Template'));

    await waitFor(() => {
      expect(screen.getByText('Template Variables')).toBeInTheDocument();
      expect(screen.getByLabelText('name')).toBeInTheDocument();
      expect(screen.getByLabelText('company')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const sendButton = screen.getByRole('button', { name: /send email/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText('At least one recipient is required')
      ).toBeInTheDocument();
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
      expect(screen.getByText('Content is required')).toBeInTheDocument();
    });
  });

  it('sends email with valid data', async () => {
    const user = userEvent.setup();
    const mockSendEmail = vi.fn().mockResolvedValue({});

    mockUseSendEmail.mockReturnValue({
      mutateAsync: mockSendEmail,
      isPending: false,
    });

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Fill in the form
    const recipientsSelect = screen.getByLabelText(/recipients/i);
    await user.click(recipientsSelect);
    await user.click(screen.getByText(/john doe/i));

    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Test Subject');

    const contentInput = screen.getByLabelText(/content/i);
    await user.type(contentInput, 'Test content');

    // Submit the form
    const sendButton = screen.getByRole('button', { name: /send email/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith({
        templateId: undefined,
        recipients: [1],
        variables: {},
        subject: 'Test Subject',
        customContent: 'Test content',
      });
      expect(mockOnSent).toHaveBeenCalled();
    });
  });

  it('validates template variables before sending', async () => {
    const user = userEvent.setup();
    const mockValidateVariables = vi.fn().mockResolvedValue({
      valid: false,
      missingVariables: ['name'],
      invalidVariables: [],
    });

    mockUseEmailTemplate.mockReturnValue({
      data: mockTemplates[0],
    });

    mockUseValidateVariables.mockReturnValue({
      mutateAsync: mockValidateVariables,
      isPending: false,
    });

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Select template
    const templateSelect = screen.getByLabelText(/email template/i);
    await user.click(templateSelect);
    await user.click(screen.getByText('Welcome Template'));

    // Fill in recipients
    const recipientsSelect = screen.getByLabelText(/recipients/i);
    await user.click(recipientsSelect);
    await user.click(screen.getByText(/john doe/i));

    // Submit without filling variables
    const sendButton = screen.getByRole('button', { name: /send email/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockValidateVariables).toHaveBeenCalled();
    });
  });

  it('shows preview when preview button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Fill in subject and content
    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Test Subject');

    const contentInput = screen.getByLabelText(/content/i);
    await user.type(contentInput, 'Test content');

    // Click preview button
    const previewButton = screen.getByRole('button', {
      name: /preview email/i,
    });
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Email Preview')).toBeInTheDocument();
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when sending email', () => {
    mockUseSendEmail.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    });

    render(
      <TestWrapper>
        <EmailComposer onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const sendButton = screen.getByRole('button', { name: /send email/i });
    expect(sendButton).toBeDisabled();
  });

  it('initializes with provided initial data', () => {
    const initialData = {
      subject: 'Initial Subject',
      content: 'Initial Content',
      recipients: [mockRecipients[0]],
      variables: { name: 'John' },
    };

    render(
      <TestWrapper>
        <EmailComposer
          onSent={mockOnSent}
          onCancel={mockOnCancel}
          initialData={initialData}
        />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Initial Subject')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial Content')).toBeInTheDocument();
  });
});
