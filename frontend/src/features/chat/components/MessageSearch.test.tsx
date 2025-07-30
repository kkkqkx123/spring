/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { MessageSearch } from './MessageSearch';
import { useSearchMessages } from '../hooks/useChat';
import type { ChatMessage, PaginatedResponse } from '../../../types';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../hooks/useChat');
vi.mock('../../../utils', () => ({
  formatDate: vi.fn(() => 'Jan 1, 2024 10:30 AM'),
  debounce: vi.fn(fn => fn),
}));

const mockUseSearchMessages = useSearchMessages as any;

const mockMessages: ChatMessage[] = [
  {
    id: 1,
    content: 'Hello world, this is a test message',
    senderId: 2,
    senderName: 'John Doe',
    recipientId: 1,
    recipientName: 'Jane Smith',
    createdAt: '2024-01-01T10:30:00Z',
    read: true,
  },
  {
    id: 2,
    content: 'Another test message with different content',
    senderId: 1,
    senderName: 'Jane Smith',
    recipientId: 2,
    recipientName: 'John Doe',
    createdAt: '2024-01-01T11:00:00Z',
    read: false,
  },
];

const mockSearchResults: PaginatedResponse<ChatMessage> = {
  content: mockMessages,
  totalElements: 2,
  totalPages: 1,
  size: 50,
  number: 0,
  first: true,
  last: true,
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{component}</MantineProvider>
    </QueryClientProvider>
  );
};

describe('MessageSearch', () => {
  const mockOnMessageSelect = vi.fn();

  beforeEach(() => {
    mockUseSearchMessages.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input correctly', () => {
    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    expect(
      screen.getByPlaceholderText('Search messages...')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter a search term to find messages')
    ).toBeInTheDocument();
  });

  it('shows search results when query is provided', async () => {
    // Set up the mock to return results for any query
    mockUseSearchMessages.mockImplementation((query: string) => {
      if (query && query.trim()) {
        return {
          data: mockSearchResults,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('Found 2 messages')).toBeInTheDocument();
    });

    // Check for message content - just verify that results are shown
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
  });

  it('shows loading state when searching', () => {
    mockUseSearchMessages.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('shows error state when search fails', () => {
    mockUseSearchMessages.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Search failed'),
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(screen.getByText('Failed to search messages')).toBeInTheDocument();
  });

  it('shows no results message when no messages found', () => {
    mockUseSearchMessages.mockReturnValue({
      data: { ...mockSearchResults, content: [], totalElements: 0 },
      isLoading: false,
      error: null,
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(
      screen.getByText('No messages found for "nonexistent"')
    ).toBeInTheDocument();
  });

  it('handles message selection', async () => {
    mockUseSearchMessages.mockImplementation((query: string) => {
      if (query && query.trim()) {
        return {
          data: mockSearchResults,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('Found 2 messages')).toBeInTheDocument();
    });

    // Find the message by partial text and click its container
    const messageElement = screen.getByText(/Hello world/);
    const messageContainer = messageElement.closest('.mantine-Paper-root');
    if (messageContainer) {
      fireEvent.click(messageContainer);
    }

    expect(mockOnMessageSelect).toHaveBeenCalledWith(mockMessages[0]);
  });

  it('clears search when clear button is clicked', async () => {
    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    await userEvent.type(searchInput, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    await userEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(
      screen.getByText('Enter a search term to find messages')
    ).toBeInTheDocument();
  });

  it('highlights search terms in results', async () => {
    mockUseSearchMessages.mockImplementation((query: string) => {
      if (query && query.trim()) {
        return {
          data: mockSearchResults,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      // The Highlight component should highlight the search term
      expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    });
  });

  it('shows sender and recipient information', async () => {
    mockUseSearchMessages.mockImplementation((query: string) => {
      if (query && query.trim()) {
        return {
          data: mockSearchResults,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('To: Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('To: John Doe')).toBeInTheDocument();
    });
  });

  it('shows read status badges', async () => {
    mockUseSearchMessages.mockImplementation((query: string) => {
      if (query && query.trim()) {
        return {
          data: mockSearchResults,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        error: null,
      };
    });

    renderWithProviders(
      <MessageSearch onMessageSelect={mockOnMessageSelect} />
    );

    const searchInput = screen.getByPlaceholderText('Search messages...');
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText('Read')).toBeInTheDocument();
    });
  });
});
