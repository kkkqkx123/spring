import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, STORAGE_KEYS } from '../constants';
import { storage } from '../utils';
import { type ChatMessage, type Notification } from '../types';
import {
  MessageBatcher,
  ThrottledEventEmitter,
  MessageQueue,
  ConnectionManager,
  useOptimizedWebSocketHandler,
} from '../utils/websocketOptimization';

// Event types for type safety
export interface OptimizedWebSocketEvents {
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

// Optimized event bus with batching and throttling
export class OptimizedEventBus {
  private listeners: Map<string, Function[]> = new Map();
  private messageBatchers: Map<string, MessageBatcher<any>> = new Map();
  private throttledEmitter: ThrottledEventEmitter = new ThrottledEventEmitter();

  subscribe<K extends keyof OptimizedWebSocketEvents>(
    event: K,
    callback: OptimizedWebSocketEvents[K],
    options: {
      batched?: boolean;
      batchSize?: number;
      batchDelay?: number;
      throttled?: boolean;
      throttleDelay?: number;
    } = {}
  ): () => void {
    const {
      batched = false,
      batchSize = 10,
      batchDelay = 100,
      throttled = false,
      throttleDelay = 100,
    } = options;

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    let actualCallback = callback;

    // Set up batching if requested
    if (batched) {
      if (!this.messageBatchers.has(event)) {
        const batcher = new MessageBatcher(
          (messages: any[]) => {
            const listeners = this.listeners.get(event) || [];
            listeners.forEach(listener => {
              if (listener === callback) {
                // Call with batched messages
                (callback as any)(messages);
              }
            });
          },
          batchSize,
          batchDelay
        );
        this.messageBatchers.set(event, batcher);
      }

      actualCallback = ((message: any) => {
        this.messageBatchers.get(event)?.add(message);
      }) as OptimizedWebSocketEvents[K];
    }

    // Set up throttling if requested
    if (throttled) {
      this.throttledEmitter.on(event, actualCallback, throttleDelay);
      actualCallback = (() => {}) as OptimizedWebSocketEvents[K]; // Placeholder
    }

    this.listeners.get(event)!.push(actualCallback);

    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe<K extends keyof OptimizedWebSocketEvents>(
    event: K,
    callback: OptimizedWebSocketEvents[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.findIndex(listener => listener === callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }

    // Clean up batcher if no more listeners
    if (eventListeners?.length === 0) {
      this.messageBatchers.get(event)?.clear();
      this.messageBatchers.delete(event);
      this.throttledEmitter.off(event);
    }
  }

  emit<K extends keyof OptimizedWebSocketEvents>(
    event: K,
    ...args: Parameters<OptimizedWebSocketEvents[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Check if this event uses throttling
      if (this.throttledEmitter) {
        this.throttledEmitter.emit(event, ...args);
      }

      // Handle regular listeners
      eventListeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  flush(event?: string): void {
    if (event) {
      this.messageBatchers.get(event)?.flush();
    } else {
      this.messageBatchers.forEach(batcher => batcher.flush());
    }
  }

  clear(): void {
    this.listeners.clear();
    this.messageBatchers.forEach(batcher => batcher.clear());
    this.messageBatchers.clear();
    this.throttledEmitter.clear();
  }

  getListenerCount(event: keyof OptimizedWebSocketEvents): number {
    return this.listeners.get(event)?.length || 0;
  }

  getBatchSize(event: string): number {
    return this.messageBatchers.get(event)?.getBatchSize() || 0;
  }
}

export class OptimizedWebSocketService {
  private socket: Socket | null = null;
  private eventBus: OptimizedEventBus;
  private messageQueue: MessageQueue;
  private connectionManager: ConnectionManager;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private latency = 0;

  constructor() {
    this.eventBus = new OptimizedEventBus();
    this.messageQueue = new MessageQueue(200, 10 * 60 * 1000); // 10 minutes
    this.connectionManager = new ConnectionManager(5, 1000, 30000);
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
      this.startHeartbeat();

      // Handle connection success
      this.socket.on('connect', () => {
        console.log('Optimized WebSocket connected');
        this.connectionManager.reset();
        this.processQueuedMessages();
        this.eventBus.emit('connect');
        resolve();
      });

      // Handle connection error
      this.socket.on('connect_error', error => {
        console.error('Optimized WebSocket connection error:', error);
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
      console.log('Optimized WebSocket disconnected:', reason);
      this.stopHeartbeat();
      this.eventBus.emit('disconnect', reason);

      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        return; // Server initiated disconnect, don't reconnect automatically
      }

      this.attemptReconnection();
    });

    this.socket.on('error', error => {
      console.error('Optimized WebSocket error:', error);
      this.eventBus.emit('error', error);
    });

    // Chat events with batching for high-frequency messages
    this.socket.on('chat:new-message', (message: ChatMessage) => {
      this.eventBus.emit('chat:new-message', message);
    });

    this.socket.on(
      'chat:message-read',
      (data: { messageId: number; userId: number }) => {
        this.eventBus.emit('chat:message-read', data);
      }
    );

    // Typing events are throttled to prevent spam
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

    // Notification events with batching
    this.socket.on('notification:new', (notification: Notification) => {
      this.eventBus.emit('notification:new', notification);
    });

    this.socket.on('notification:read', (data: { notificationId: number }) => {
      this.eventBus.emit('notification:read', data);
    });

    this.socket.on('notification:count-updated', (data: { count: number }) => {
      this.eventBus.emit('notification:count-updated', data);
    });

    // Heartbeat response
    this.socket.on('pong', (timestamp: number) => {
      this.latency = Date.now() - timestamp;
    });
  }

  private async attemptReconnection(): Promise<void> {
    if (!this.connectionManager.canReconnect()) {
      console.error('Max reconnection attempts reached');
      this.eventBus.emit('reconnect_failed');
      return;
    }

    this.eventBus.emit(
      'reconnect_attempt',
      this.connectionManager.getAttempts() + 1
    );

    try {
      const success = await this.connectionManager.attemptReconnect(() =>
        this.connect()
      );
      if (success) {
        this.eventBus.emit('reconnect', this.connectionManager.getAttempts());
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.eventBus.emit('reconnect_error', error as Error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.lastPingTime = Date.now();
        this.socket.emit('ping', this.lastPingTime);
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processQueuedMessages(): void {
    const queuedMessages = this.messageQueue.dequeueAll();
    queuedMessages.forEach(({ event, data }) => {
      if (this.socket?.connected) {
        this.socket.emit(event, data);
      }
    });
  }

  // Optimized message sending with queuing
  private sendMessage(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later sending
      this.messageQueue.enqueue(event, data);
    }
  }

  // Chat methods
  sendChatMessage(recipientId: number, content: string): void {
    this.sendMessage('chat:send-message', {
      recipientId,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  markMessageAsRead(messageId: number): void {
    this.sendMessage('chat:mark-read', { messageId });
  }

  sendTypingIndicator(recipientId: number, isTyping: boolean): void {
    // Don't queue typing indicators
    if (this.socket?.connected) {
      this.socket.emit('chat:typing', { recipientId, isTyping });
    }
  }

  // Notification methods
  markNotificationAsRead(notificationId: number): void {
    this.sendMessage('notification:mark-read', { notificationId });
  }

  // Connection management
  disconnect(): void {
    this.stopHeartbeat();
    this.connectionManager.cancel();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = false;
    this.connectionPromise = null;
    this.messageQueue.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.socket?.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  getLatency(): number {
    return this.latency;
  }

  getQueueSize(): number {
    return this.messageQueue.size();
  }

  // Health check with timeout
  async ping(): Promise<number> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.socket!.emit('ping', startTime, (response: number) => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        resolve(latency);
      });
    });
  }

  // Event subscription with optimization options
  subscribe<K extends keyof OptimizedWebSocketEvents>(
    event: K,
    callback: OptimizedWebSocketEvents[K],
    options?: {
      batched?: boolean;
      batchSize?: number;
      batchDelay?: number;
      throttled?: boolean;
      throttleDelay?: number;
    }
  ): () => void {
    return this.eventBus.subscribe(event, callback, options);
  }

  unsubscribe<K extends keyof OptimizedWebSocketEvents>(
    event: K,
    callback: OptimizedWebSocketEvents[K]
  ): void {
    this.eventBus.unsubscribe(event, callback);
  }

  // Flush batched messages
  flush(event?: string): void {
    this.eventBus.flush(event);
  }

  // Get performance metrics
  getMetrics() {
    return {
      connected: this.isConnected(),
      latency: this.latency,
      queueSize: this.messageQueue.size(),
      reconnectAttempts: this.connectionManager.getAttempts(),
      canReconnect: this.connectionManager.canReconnect(),
    };
  }
}

// Create singleton instance
export const optimizedWebSocketService = new OptimizedWebSocketService();

// Export default instance
export default optimizedWebSocketService;
