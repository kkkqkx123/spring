/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { ChatInterface } from './ChatInterface';
import { useAuth } from '../../../hooks/useAuth';
import { useRealTimeChat, useTypingIndicator } from '../hooks/useRealTimeChat';
import type { ChatMessage, PaginatedResponse } from '../../../types';
import { vi } from 'vitest';
import { chatApi } from '../services/chatApi';
import { useConversations, useSendMessage } from '../hooks/useChat';

// Mock the hooks
vi.mock('../../../hooks/useAuth');
vi.mock('../hooks/useChat', async () => {
  const originalModule = await vi.importActual('../hooks/useChat');
  return {
    ...originalModule,
    useConversations: vi.fn(),
    useSendMessage: vi.fn(),
  };
});
vi.mock('../hooks/useRealTimeChat', () => ({
  useRealTimeChat: vi.fn(),
  useTypingIndicator: vi.fn(),
}));

const mockUseAuth = useAuth as any;
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
      <MantineProvider>{component}</MantineProvider>
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

    vi.spyOn(chatApi, 'getConversation').mockResolvedValue(
      mockConversationData
    );

    mockUseConversations.mockReturnValue({
      data: [
        {
          userId: 2,
          userName: 'John Doe',
          lastMessage: {
            id: 1,
            content: 'Hello!',
            senderId: 2,
            senderName: 'John Doe',
            recipientId: 1,
            recipientName: 'Jane Smith',
            createdAt: '2024-01-01T10:30:00Z',
            read: true,
          },
          unreadCount: 0,
        },
      ],
      isLoading: false,
      error: null,
    });

    mockUseRealTimeChat.mockReturnValue({
      onlineUsers: new Set([2]),
      typingUsers: new Map(),
      sendTypingIndicator: vi.fn(),
      sendMessage: vi.fn(),
      markAsRead: vi.fn(),
      isConnected: true,
      connectionState: 'connected',
    } as any);

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
    vi.restoreAllMocks();
  });

  it('renders chat interface with conversation list', () => {
    renderWithProviders(<ChatInterface />);

    expect(
      screen.getByPlaceholderText('Search conversations...')
    ).toBeInTheDocument();
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
  });

  it('shows selected conversation with messages', async () => {
    renderWithProviders(<ChatInterface defaultSelectedUserId={2} />);

    expect(await screen.findByText('Hello!')).toBeInTheDocument();
    expect(await screen.findByText('Hi there!')).toBeInTheDocument();
  });

  it('shows loading state when loading messages', async () => {
    vi.spyOn(chatApi, 'getConversation').mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    renderWithProviders(<ChatInterface defaultSelectedUserId={2} />);

    expect(await screen.findByTestId('loader-container')).toBeInTheDocument();
  });

  it('shows error state when messages fail to load', async () => {
    vi.spyOn(chatApi, 'getConversation').mockRejectedValue(
      new Error('Failed to load')
    );

    renderWithProviders(<ChatInterface defaultSelectedUserId={2} />);

    expect(
      await screen.findByText('Error loading messages')
    ).toBeInTheDocument();
  });

  it('shows empty state when no messages', async () => {
    vi.spyOn(chatApi, 'getConversation').mockResolvedValue({
      ...mockConversationData,
      content: [],
    });

    renderWithProviders(<ChatInterface defaultSelectedUserId={2} />);

    expect(await screen.findByText('No messages yet')).toBeInTheDocument();
  });
});
