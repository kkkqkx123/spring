// Chat feature public API

// Components
export { ChatInterface } from './components/ChatInterface';
export { ConversationList } from './components/ConversationList';
export { MessageBubble } from './components/MessageBubble';
export { MessageInput } from './components/MessageInput';
export { MessageHistory } from './components/MessageHistory';
export { MessageSearch } from './components/MessageSearch';
export { TypingIndicator } from './components/TypingIndicator';
export { OnlineStatus, OnlineDot } from './components/OnlineStatus';

// Hooks
export {
  useConversations,
  useConversation,
  useSendMessage,
  useMarkAsRead,
  useUnreadCount,
  useSearchMessages,
  useOnlineUsers,
} from './hooks/useChat';

export { useRealTimeChat, useTypingIndicator } from './hooks/useRealTimeChat';

// Services
export {
  chatApi,
  type ChatMessageRequest,
  type ChatMessageResponse,
} from './services/chatApi';
