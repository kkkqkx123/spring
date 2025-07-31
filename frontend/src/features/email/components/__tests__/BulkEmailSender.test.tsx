import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BulkEmailSender } from '../BulkEmailSender';
import type { EmailTemplate, Department } from '../../../../types';

// Mock the hooks
const mockUseEmailTemplates = vi.fn();
const mockUseEmailTemplate = vi.fn();
const mockUseDepartments = vi.fn();
const mockUseEmployees = vi.fn();
const mockUseSendBulkEmail = vi.fn();
const mockUseBulkEmailProgress = vi.fn();
const mockUseValidateVariables = vi.fn();

vi.mock('../../hooks/useEmail', () => ({
  useEmailTemplates: () => mockUseEmailTemplates(),
  useEmailTemplate: () => mockUseEmailTemplate(),
  useSendBulkEmail: () => mockUseSendBulkEmail(),
  useBulkEmailProgress: () => mockUseBulkEmailProgress(),
  useValidateVariables: () => mockUseValidateVariables(),
}));

vi.mock('../../../departments/hooks/useDepartments', () => ({
  useDepartments: () => mockUseDepartments(),
}));

vi.mock('../../../employees/hooks/useEmployees', () => ({
  useEmployees: () => mockUseEmployees(),
}));

// Mock data
const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Company Update',
    subject: 'Important Company Update',
    content: 'Hello {{name}}, we have an important update about {{topic}}.',
    variables: ['name', 'topic'],
    description: 'General company updates',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'Engineering',
    description: 'Software development team',
    employeeCount: 25,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Marketing',
    description: 'Marketing and communications',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockEmployees = {
  content: [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      employeeNumber: 'EMP001',
      department: mockDepartments[0],
      position: { id: 1, title: 'Developer', departmentId: 1 },
      hireDate: '2024-01-01',
      status: 'ACTIVE' as const,
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      employeeNumber: 'EMP002',
      department: mockDepartments[1],
      position: { id: 2, title: 'Manager', departmentId: 2 },
      hireDate: '2024-01-01',
      status: 'ACTIVE' as const,
    },
  ],
  totalElements: 2,
  totalPages: 1,
  size: 1000,
  number: 0,
  first: true,
  last: true,
};

// Test wrapper
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

describe('BulkEmailSender', () => {
  const mockOnSent = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseEmailTemplates.mockReturnValue({
      data: mockTemplates,
      isLoading: false,
    });

    mockUseEmailTemplate.mockReturnValue({
      data: null,
    });

    mockUseDepartments.mockReturnValue({
      data: mockDepartments,
      isLoading: false,
    });

    mockUseEmployees.mockReturnValue({
      data: mockEmployees,
      isLoading: false,
    });

    mockUseSendBulkEmail.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ jobId: 'job-123' }),
      isPending: false,
    });

    mockUseBulkEmailProgress.mockReturnValue({
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
  });

  it('renders bulk email sender form', () => {
    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByText('Bulk Email Sender')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /email template/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /departments/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /individual employees/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /send to \d+ recipients/i })
    ).toBeInTheDocument();
  });

  it('shows recipient count based on selections', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Initially should show 0 recipients
    expect(screen.getByText('~0 recipients')).toBeInTheDocument();

    // Select a department
    const departmentSelect = screen.getByRole('textbox', {
      name: /departments/i,
    });
    await user.click(departmentSelect);
    await user.click(screen.getByText('Engineering'));

    // Should show department employee count
    await waitFor(() => {
      expect(screen.getByText('~25 recipients')).toBeInTheDocument();
    });
  });

  it('validates template selection', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Try to submit without selecting template
    const sendButton = screen.getByRole('button', {
      name: /send to \d+ recipients/i,
    });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Template is required')).toBeInTheDocument();
    });
  });

  it('shows template variables when template is selected', async () => {
    const user = userEvent.setup();

    mockUseEmailTemplate.mockReturnValue({
      data: mockTemplates[0],
    });

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Select template
    const templateSelect = screen.getByRole('textbox', {
      name: /email template/i,
    });
    await user.click(templateSelect);
    await user.click(screen.getByText('Company Update'));

    await waitFor(() => {
      expect(screen.getByText('Template Variables')).toBeInTheDocument();
      expect(screen.getByLabelText('name')).toBeInTheDocument();
      expect(screen.getByLabelText('topic')).toBeInTheDocument();
    });
  });

  it('sends bulk email with valid data', async () => {
    const user = userEvent.setup();
    const mockSendBulkEmail = vi.fn().mockResolvedValue({ jobId: 'job-123' });

    mockUseSendBulkEmail.mockReturnValue({
      mutateAsync: mockSendBulkEmail,
      isPending: false,
    });

    mockUseEmailTemplate.mockReturnValue({
      data: mockTemplates[0],
    });

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Select template
    const templateSelect = screen.getByRole('textbox', {
      name: /email template/i,
    });
    await user.click(templateSelect);
    await user.click(screen.getByText('Company Update'));

    // Fill template variables
    await waitFor(() => {
      expect(screen.getByLabelText('name')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('name'), 'Team');
    await user.type(screen.getByLabelText('topic'), 'New Policy');

    // Select department
    const departmentSelect = screen.getByRole('textbox', {
      name: /departments/i,
    });
    await user.click(departmentSelect);
    await user.click(screen.getByText('Engineering'));

    // Submit form
    const sendButton = screen.getByRole('button', {
      name: /send to \d+ recipients/i,
    });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSendBulkEmail).toHaveBeenCalledWith({
        templateId: 1,
        departmentIds: [1],
        employeeIds: [],
        variables: { name: 'Team', topic: 'New Policy' },
        subject: 'Important Company Update',
        customContent:
          'Hello {{name}}, we have an important update about {{topic}}.',
      });
    });
  });

  it('shows warning for large recipient counts', async () => {
    const user = userEvent.setup();

    // Mock large department
    const largeDepartments = [
      {
        ...mockDepartments[0],
        employeeCount: 150,
      },
    ];

    mockUseDepartments.mockReturnValue({
      data: largeDepartments,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    // Select the large department
    const departmentSelect = screen.getByRole('textbox', {
      name: /departments/i,
    });
    await user.click(departmentSelect);
    await user.click(screen.getByText('Engineering'));

    await waitFor(() => {
      expect(
        screen.getByText(/you are about to send emails to 150 recipients/i)
      ).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form during sending', () => {
    mockUseSendBulkEmail.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    });

    render(
      <TestWrapper>
        <BulkEmailSender onSent={mockOnSent} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const sendButton = screen.getByRole('button', {
      name: /send to \d+ recipients/i,
    });
    expect(sendButton).toBeDisabled();
  });
});
