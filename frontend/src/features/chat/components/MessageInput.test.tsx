import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { MessageInput } from './MessageInput';
import { useTypingIndicator } from '../hooks/useRealTimeChat';
import { useSendMessage } from '../hooks/useChat';

// Mock the hooks
vi.mock('../hooks/useRealTimeChat');
vi.mock('../hooks/useChat');
vi.mock('../../../utils', () => ({
  debounce: vi.fn((fn) => fn),
}));

const mockUseTypingIndicator = useTypingIndicator as any;
const mockUseSendMessage = useSendMessage as any;

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

describe('MessageInput', () => {
  const mockStartTyping = vi.fn();
  const mockStopTyping = vi.fn();
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    mockUseTypingIndicator.mockReturnValue({
      isTyping: false,
      startTyping: mockStartTyping,
      stopTyping: mockStopTyping,
    });

    mockUseSendMessage.mockReturnValue({
      mutate: mockSendMessage,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders message input correctly', () => {
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    expect(screen.getByPlaceholderText('Message John Doe...')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    expect(screen.getByLabelText('Add emoji')).toBeInTheDocument();
    expect(screen.getByLabelText('Attach file')).toBeInTheDocument();
  });

  it('handles text input and typing indicators', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const input = screen.getByPlaceholderText('Message John Doe...');
    await user.type(input, 'Hello');

    expect(input).toHaveValue('Hello');
    expect(mockStartTyping).toHaveBeenCalled();
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const input = screen.getByPlaceholderText('Message John Doe...');
    await user.type(input, 'Hello world');
    await user.keyboard('{Enter}');

    expect(mockSendMessage).toHaveBeenCalledWith(
      {
        recipientId: 1,
        content: 'Hello world',
      },
      expect.any(Object)
    );
  });

  it('sends message on send button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const input = screen.getByPlaceholderText('Message John Doe...');
    const sendButton = screen.getByLabelText('Send message');

    await user.type(input, 'Test message');
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith(
      {
        recipientId: 1,
        content: 'Test message',
      },
      expect.any(Object)
    );
  });

  it('disables send button for empty messages', () => {
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });

  it('shows emoji picker when emoji button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const emojiButton = screen.getByLabelText('Add emoji');
    await user.click(emojiButton);

    expect(screen.getByText('Click an emoji to add it')).toBeInTheDocument();
  });

  it('adds emoji to message when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const input = screen.getByPlaceholderText('Message John Doe...');
    const emojiButton = screen.getByLabelText('Add emoji');
    
    await user.click(emojiButton);
    
    // Find and click the first emoji
    const firstEmoji = screen.getByText('😀');
    await user.click(firstEmoji);

    expect(input).toHaveValue('😀');
  });

  it('handles disabled state', () => {
    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" disabled />
    );

    const input = screen.getByPlaceholderText('Message John Doe...');
    const sendButton = screen.getByLabelText('Send message');
    const emojiButton = screen.getByLabelText('Add emoji');
    const attachButton = screen.getByLabelText('Attach file');

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    expect(emojiButton).toBeDisabled();
    expect(attachButton).toBeDisabled();
  });

  it('shows loading state when sending', () => {
    mockUseSendMessage.mockReturnValue({
      mutate: mockSendMessage,
      isPending: true,
    });

    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });

  it('clears input after successful send', async () => {
    const user = userEvent.setup();
    let onSuccessCallback: any;

    mockUseSendMessage.mockReturnValue({
      mutate: vi.fn((data, options) => {
        onSuccessCallback = options.onSuccess;
      }),
      isPending: false,
    });

    renderWithProviders(
      <MessageInput recipientId={1} recipientName="John Doe" />
    );

    const input = screen.getByPlaceholderText('Message John Doe...');
    await user.type(input, 'Test message');
    
    const sendButton = screen.getByLabelText('Send message');
    await user.click(sendButton);

    // Simulate successful send
    if (onSuccessCallback) {
      onSuccessCallback();
    }

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});