import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, STORAGE_KEYS } from '../constants';
import { storage } from '../utils';
import { type ChatMessage, type Notification } from '../types';

// Event types for type safety
export interface WebSocketEvents {
  // Chat events
  'chat:new-message': (message: ChatMessage) => void;
  'chat:message-read': (data: { messageId: number; userId: number }) => void;
  'chat:typing': (data: {
    userId: number;
    userName: string;
    isTyping: boolean;
  }) => void;
  'chat:user-online': (data: { userId: number; isOnline: boolean }) => void;

  // Notification events
  'notification:new': (notification: Notification) => void;
  'notification:read': (data: { notificationId: number }) => void;
  'notification:count-updated': (data: { count: number }) => void;

  // System events
  connect: () => void;
  disconnect: (reason: string) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;
  error: (error: Error) => void;
}

// Event bus for managing WebSocket events across the application
export class EventBus {
  private listeners: {
    [K in keyof WebSocketEvents]?: ((...args: unknown[]) => void)[];
  } = {};

  subscribe<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback as (...args: unknown[]) => void);

    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      const index = eventListeners.indexOf(
        callback as (...args: unknown[]) => void
      );
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit<K extends keyof WebSocketEvents>(
    event: K,
    ...args: Parameters<WebSocketEvents[K]>
  ): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          // The listener is cast to the correct type before being called
          (listener as (...args: Parameters<WebSocketEvents[K]>) => void)(
            ...args
          );
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  clear(): void {
    this.listeners = {};
  }

  getListenerCount(event: keyof WebSocketEvents): number {
    return this.listeners[event]?.length || 0;
  }
}

export class WebSocketService {
  private socket: Socket | null = null;
  private eventBus: EventBus;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async connect(): Promise<void> {
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.socket?.connected) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async _connect(): Promise<void> {
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      throw new Error('No authentication token available');
    }

    return new Promise((resolve, reject) => {
      this.socket = io(WS_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        upgrade: false,
        timeout: 10000,
        reconnection: false, // We handle reconnection manually
      });

      this.setupEventHandlers();

      // Handle connection success
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.eventBus.emit('connect');
        resolve();
      });

      // Handle connection error
      this.socket.on('connect_error', error => {
        console.error('WebSocket connection error:', error);
        this.eventBus.emit('error', error);
        reject(error);
      });

      // Set a timeout for connection
      const timeout = setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', reason => {
      console.log('WebSocket disconnected:', reason);
      this.eventBus.emit('disconnect', reason);

      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }

      this.attemptReconnection();
    });

    this.socket.on('error', error => {
      console.error('WebSocket error:', error);
      this.eventBus.emit('error', error);
    });

    // Chat events
    this.socket.on('chat:new-message', (message: ChatMessage) => {
      this.eventBus.emit('chat:new-message', message);
    });

    this.socket.on(
      'chat:message-read',
      (data: { messageId: number; userId: number }) => {
        this.eventBus.emit('chat:message-read', data);
      }
    );

    this.socket.on(
      'chat:typing',
      (data: { userId: number; userName: string; isTyping: boolean }) => {
        this.eventBus.emit('chat:typing', data);
      }
    );

    this.socket.on(
      'chat:user-online',
      (data: { userId: number; isOnline: boolean }) => {
        this.eventBus.emit('chat:user-online', data);
      }
    );

    // Notification events
    this.socket.on('notification:new', (notification: Notification) => {
      this.eventBus.emit('notification:new', notification);
    });

    this.socket.on('notification:read', (data: { notificationId: number }) => {
      this.eventBus.emit('notification:read', data);
    });

    this.socket.on('notification:count-updated', (data: { count: number }) => {
      this.eventBus.emit('notification:count-updated', data);
    });
  }

  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.eventBus.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    this.eventBus.emit('reconnect_attempt', this.reconnectAttempts);

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    // Wait before attempting reconnection
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));

    try {
      await this.connect();
      this.eventBus.emit('reconnect', this.reconnectAttempts);
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.eventBus.emit('reconnect_error', error as Error);

      // Exponential backoff with jitter
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2 + Math.random() * 1000,
        this.maxReconnectDelay
      );

      // Try again
      this.attemptReconnection();
    }
  }

  // Chat methods
  sendChatMessage(recipientId: number, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('chat:send-message', {
      recipientId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  markMessageAsRead(messageId: number): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('chat:mark-read', { messageId });
  }

  sendTypingIndicator(recipientId: number, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return; // Don't throw error for typing indicators
    }

    this.socket.emit('chat:typing', { recipientId, isTyping });
  }

  // Notification methods
  markNotificationAsRead(notificationId: number): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('notification:mark-read', { notificationId });
  }

  // Connection management
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.socket?.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  // Health check
  async ping(): Promise<number> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.socket!.emit('ping', startTime, (_response: number) => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        resolve(latency);
      });
    });
  }

  // Event subscription helpers
  subscribe<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): () => void {
    return this.eventBus.subscribe(event, callback);
  }

  unsubscribe<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): void {
    this.eventBus.unsubscribe(event, callback);
  }
}

// Create singleton instances
export const eventBus = new EventBus();
export const webSocketService = new WebSocketService(eventBus);

// Export default instance
export default webSocketService;
