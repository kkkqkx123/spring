import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { ChatInterface } from './ChatInterface';
import { useAuth } from '../../../hooks/useAuth';
import { useConversation, useConversations, useSendMessage } from '../hooks/useChat';
import { useRealTimeChat, useTypingIndicator } from '../hooks/useRealTimeChat';
import type { ChatMessage, PaginatedResponse } from '../../../types';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../../hooks/useAuth');
vi.mock('../hooks/useChat', () => ({
  useConversation: vi.fn(),
  useConversations: vi.fn(),
  useSendMessage: vi.fn(),
}));
vi.mock('../hooks/useRealTimeChat', () => ({
  useRealTimeChat: vi.fn(),
  useTypingIndicator: vi.fn(),
}));

const mockUseAuth = useAuth as any;
const mockUseConversation = useConversation as any;
const mockUseRealTimeChat = useRealTimeChat as any;
const mockUseConversations = useConversations as any;
const mockUseSendMessage = useSendMessage as any;
const mockUseTypingIndicator = useTypingIndicator as any;

const mockMessages: ChatMessage[] = [
  {
    id: 1,
    content: 'Hello!',
    senderId: 2,
    senderName: 'John Doe',
    recipientId: 1,
    recipientName: 'Jane Smith',
    createdAt: '2024-01-01T10:30:00Z',
    read: true,
  },
  {
    id: 2,
    content: 'Hi there!',
    senderId: 1,
    senderName: 'Jane Smith',
    recipientId: 2,
    recipientName: 'John Doe',
    createdAt: '2024-01-01T10:31:00Z',
    read: false,
  },
];

const mockConversationData: PaginatedResponse<ChatMessage> = {
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
      <MantineProvider>
        {component}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('ChatInterface', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'jane', email: 'jane@example.com' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    mockUseConversation.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    mockUseRealTimeChat.mockReturnValue({
      onlineUsers: new Set([2]),
      typingUsers: new Map(),
      sendTypingIndicator: vi.fn(),
      sendMessage: vi.fn(),
      markAsRead: vi.fn(),
      isConnected: true,
      connectionState: 'connected',
    } as any);

    // Mock the hooks used by MessageInput and MessageHistory
    mockUseSendMessage.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mockUseTypingIndicator.mockReturnValue({
      isTyping: false,
      startTyping: vi.fn(),
      stopTyping: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with conversation list', () => {
    renderWithProviders(<ChatInterface />);

    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
  });

  it('shows selected conversation with messages', () => {
    mockUseConversation.mockReturnValue({
      data: mockConversationData,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(
      <ChatInterface defaultSelectedUserId={2} />
    );

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading state when loading messages', () => {
    mockUseConversation.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderWithProviders(
      <ChatInterface defaultSelectedUserId={2} />
    );

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('shows error state when messages fail to load', () => {
    mockUseConversation.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    renderWithProviders(
      <ChatInterface defaultSelectedUserId={2} />
    );

    expect(screen.getByText('Error loading messages')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    mockUseConversation.mockReturnValue({
      data: { ...mockConversationData, content: [] },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(
      <ChatInterface defaultSelectedUserId={2} />
    );

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });
});