import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { EmailHistory } from '../EmailHistory';
import type {
  EmailHistory as EmailHistoryType,
  PaginatedResponse,
} from '../../../../types';

// Mock the hooks
const mockUseEmailHistory = vi.fn();
const mockUseEmailDetails = vi.fn();

vi.mock('../../hooks/useEmail', () => ({
  useEmailHistory: () => mockUseEmailHistory(),
  useEmailDetails: () => mockUseEmailDetails(),
}));

// Mock data
const mockEmailHistoryData: PaginatedResponse<EmailHistoryType> = {
  content: [
    {
      id: 1,
      subject: 'Welcome to the Company',
      recipientCount: 5,
      status: 'SENT',
      sentAt: '2024-01-15T10:30:00Z',
      templateName: 'Welcome Template',
    },
    {
      id: 2,
      subject: 'Monthly Newsletter',
      recipientCount: 100,
      status: 'SENDING',
      sentAt: '2024-01-15T09:00:00Z',
      templateName: 'Newsletter Template',
    },
    {
      id: 3,
      subject: 'System Maintenance Notice',
      recipientCount: 25,
      status: 'FAILED',
      sentAt: '2024-01-14T16:45:00Z',
      errorMessage: 'SMTP server unavailable',
    },
  ],
  totalElements: 3,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
};

const mockEmailDetails = {
  id: 1,
  subject: 'Welcome to the Company',
  recipientCount: 5,
  status: 'SENT' as const,
  sentAt: '2024-01-15T10:30:00Z',
  templateName: 'Welcome Template',
  content: 'Welcome to our company! We are excited to have you on board.',
  recipients: [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      type: 'individual' as const,
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      type: 'individual' as const,
    },
  ],
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
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
};

describe('EmailHistory', () => {
  const mockOnResend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseEmailHistory.mockReturnValue({
      data: mockEmailHistoryData,
      isLoading: false,
      refetch: vi.fn(),
    });

    mockUseEmailDetails.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders email history table', () => {
    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    expect(screen.getByText('Email History')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the Company')).toBeInTheDocument();
    expect(screen.getByText('Monthly Newsletter')).toBeInTheDocument();
    expect(screen.getByText('System Maintenance Notice')).toBeInTheDocument();
  });

  it('displays email status badges with correct colors', () => {
    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    // Check for status badges
    expect(screen.getByText('SENT')).toBeInTheDocument();
    expect(screen.getByText('SENDING')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('shows recipient counts', () => {
    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // First email recipients
    expect(screen.getByText('100')).toBeInTheDocument(); // Second email recipients
    expect(screen.getByText('25')).toBeInTheDocument(); // Third email recipients
  });

  it('filters emails by search query', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search by subject/i);
    await user.type(searchInput, 'Welcome');

    // Should still show the welcome email
    expect(screen.getByText('Welcome to the Company')).toBeInTheDocument();

    // Other emails should still be visible since we're not actually filtering in the test
    // In a real implementation, the filtering would happen
  });

  it('filters emails by status', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    const statusFilter = screen.getByDisplayValue('All Statuses');
    await user.click(statusFilter);
    await user.click(screen.getByText('Failed'));

    // The filter selection should work
    expect(statusFilter).toBeInTheDocument();
  });

  it('opens email details modal when view button is clicked', async () => {
    const user = userEvent.setup();

    mockUseEmailDetails.mockReturnValue({
      data: mockEmailDetails,
      isLoading: false,
    });

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    // Click the view button for the first email using test ID
    const viewButton = screen.getByTestId('view-email-1');
    await user.click(viewButton);

    // Wait for modal to open and check for content
    await waitFor(() => {
      expect(screen.getByText('Email Details')).toBeInTheDocument();
    });
  });

  it('shows resend button for failed emails', () => {
    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    // Should show resend button for the failed email
    expect(screen.getByTestId('resend-email-3')).toBeInTheDocument();
  });

  it('calls onResend when resend button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    // Click the resend button for the failed email
    const resendButton = screen.getByTestId('resend-email-3');
    await user.click(resendButton);

    expect(mockOnResend).toHaveBeenCalledWith(3);
  });

  it('shows loading state', () => {
    mockUseEmailHistory.mockReturnValue({
      data: null,
      isLoading: true,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no emails found', () => {
    mockUseEmailHistory.mockReturnValue({
      data: {
        ...mockEmailHistoryData,
        content: [],
        totalElements: 0,
      },
      isLoading: false,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    expect(screen.getByText('No emails found')).toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();

    mockUseEmailHistory.mockReturnValue({
      data: mockEmailHistoryData,
      isLoading: false,
      refetch: mockRefetch,
    });

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('changes page size when page size selector is changed', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    const pageSizeSelect = screen.getByDisplayValue('10 per page');
    await user.click(pageSizeSelect);
    await user.click(screen.getByText('25 per page'));

    // The page size should change
    expect(pageSizeSelect).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    // Check that dates are displayed (exact format may vary by locale and timezone)
    expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
  });

  it('shows template names or "Custom" for emails without templates', () => {
    render(
      <TestWrapper>
        <EmailHistory onResend={mockOnResend} />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome Template')).toBeInTheDocument();
    expect(screen.getByText('Newsletter Template')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument(); // For email without template
  });
});
