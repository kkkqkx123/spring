import { useRef, useCallback, useEffect } from 'react';

type Priority = 'high' | 'normal' | 'low';

interface Message {
  type: string;
  payload: unknown;
  priority: Priority;
}

interface WebSocketOptions {
  maxBatchSize?: number;
  maxWaitTime?: number;
  enablePriority?: boolean;
  bufferMessages?: boolean;
  maxBufferSize?: number;
  maxBufferAge?: number;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export class OptimizedWebSocketManager {
  private socket: WebSocket | null = null;
  public url: string;
  private options: WebSocketOptions;
  private messageQueue: Message[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  public reconnectAttempts = 0;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private bufferedMessages: Map<string, unknown[]> = new Map();

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = {
      maxBatchSize: 10,
      maxWaitTime: 100,
      enablePriority: true,
      bufferMessages: true,
      maxBufferSize: 50,
      maxBufferAge: 5000,
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      ...options,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('open');
        this.flushQueue();
        resolve();
      };

      this.socket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          this.emit(message.type, message.payload);
        } catch {
          this.emit('error', 'Error parsing message');
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.emit('close');
        if (this.options.reconnect) {
          this.handleReconnect();
        }
      };

      this.socket.onerror = event => {
        this.emit('error', event);
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  send(type: string, payload: unknown, priority: Priority = 'normal') {
    const message: Message = { type, payload, priority };

    if (this.options.bufferMessages && this.shouldBuffer(type)) {
      this.bufferMessage(type, payload);
      return;
    }

    this.queueMessage(message);
  }

  private queueMessage(message: Message) {
    this.messageQueue.push(message);

    if (this.options.enablePriority) {
      this.messageQueue.sort((a, b) => {
        const priorities = { high: 0, normal: 1, low: 2 };
        return priorities[a.priority] - priorities[b.priority];
      });
    }

    if (
      message.priority === 'high' ||
      this.messageQueue.length >= this.options.maxBatchSize!
    ) {
      this.flushQueue();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(
        () => this.flushQueue(),
        this.options.maxWaitTime
      );
    }
  }

  private flushQueue() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.messageQueue.length > 0
    ) {
      const batch = this.messageQueue.splice(0, this.options.maxBatchSize);
      this.socket.send(JSON.stringify(batch.length === 1 ? batch[0] : batch));
    }
  }

  private shouldBuffer(type: string): boolean {
    // Example: buffer typing indicators
    return type === 'chat:typing';
  }

  private bufferMessage(type: string, payload: unknown) {
    if (!this.bufferedMessages.has(type)) {
      this.bufferedMessages.set(type, []);
    }
    this.bufferedMessages.get(type)!.push(payload);

    if (
      this.bufferedMessages.get(type)!.length >= this.options.maxBufferSize!
    ) {
      this.flushBuffer(type);
    }
  }

  private flushBuffer(type: string) {
    if (this.bufferedMessages.has(type)) {
      const payloads = this.bufferedMessages.get(type)!;
      if (payloads.length > 0) {
        this.send(type, payloads, 'low');
        this.bufferedMessages.set(type, []);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts!) {
      this.reconnectAttempts++;
      const delay = Math.min(
        this.options.reconnectDelay! * Math.pow(2, this.reconnectAttempts - 1),
        30000
      );
      setTimeout(() => this.connect().catch(() => {}), delay);
    }
  }

  on(event: string, listener: (...args: unknown[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (...args: unknown[]) => void) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
    }
  }

  private emit(event: string, ...args: unknown[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(listener => listener(...args));
    }
  }

  getStats() {
    return {
      queuedMessages: this.messageQueue.length,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      listeners: Array.from(this.listeners.keys()),
      bufferedTypes: Array.from(this.bufferedMessages.keys()),
    };
  }
}

/**
 * WebSocket optimization utilities for batching and throttling
 */

// Message batching utility
export class MessageBatcher<T> {
  private batch: T[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly onBatch: (messages: T[]) => void;

  constructor(
    onBatch: (messages: T[]) => void,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.onBatch = onBatch;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  add(message: T): void {
    this.batch.push(message);

    // Process batch if it reaches the size limit
    if (this.batch.length >= this.batchSize) {
      this.processBatch();
      return;
    }

    // Set timeout to process batch after delay
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  private processBatch(): void {
    if (this.batch.length === 0) return;

    const messages = [...this.batch];
    this.batch = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this.onBatch(messages);
  }

  flush(): void {
    this.processBatch();
  }

  clear(): void {
    this.batch = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  getBatchSize(): number {
    return this.batch.length;
  }
}

// Hook for message batching
export function useMessageBatcher<T>(
  onBatch: (messages: T[]) => void,
  batchSize: number = 10,
  batchDelay: number = 100
) {
  const batcherRef = useRef<MessageBatcher<T> | null>(null);

  if (!batcherRef.current) {
    batcherRef.current = new MessageBatcher(onBatch, batchSize, batchDelay);
  }

  useEffect(() => {
    return () => {
      batcherRef.current?.clear();
    };
  }, []);

  const addMessage = useCallback((message: T) => {
    batcherRef.current?.add(message);
  }, []);

  const flush = useCallback(() => {
    batcherRef.current?.flush();
  }, []);

  return { addMessage, flush };
}

// Throttled event emitter
export class ThrottledEventEmitter {
  private events: Map<
    string,
    { callback: (...args: unknown[]) => void; lastCall: number; delay: number }
  > = new Map();

  on(
    event: string,
    callback: (...args: unknown[]) => void,
    delay: number = 100
  ): void {
    this.events.set(event, { callback, lastCall: 0, delay });
  }

  emit(event: string, ...args: unknown[]): void {
    const eventData = this.events.get(event);
    if (!eventData) return;

    const now = Date.now();
    if (now - eventData.lastCall >= eventData.delay) {
      eventData.callback(...args);
      eventData.lastCall = now;
    }
  }

  off(event: string): void {
    this.events.delete(event);
  }

  clear(): void {
    this.events.clear();
  }
}

// WebSocket message queue for handling connection issues
export class MessageQueue {
  private queue: Array<{
    event: string;
    data: unknown;
    timestamp: number;
  }> = [];
  private readonly maxSize: number;
  private readonly maxAge: number; // in milliseconds

  constructor(maxSize: number = 100, maxAge: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  enqueue(event: string, data: unknown): void {
    const message = {
      event,
      data,
      timestamp: Date.now(),
    };

    this.queue.push(message);

    // Remove old messages
    this.cleanup();

    // Limit queue size
    if (this.queue.length > this.maxSize) {
      this.queue = this.queue.slice(-this.maxSize);
    }
  }

  dequeue(): { event: string; data: unknown; timestamp: number } | undefined {
    return this.queue.shift();
  }

  dequeueAll(): Array<{ event: string; data: unknown; timestamp: number }> {
    const messages = [...this.queue];
    this.queue = [];
    return messages;
  }

  private cleanup(): void {
    const now = Date.now();
    this.queue = this.queue.filter(
      message => now - message.timestamp <= this.maxAge
    );
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

// Hook for WebSocket message queue
export function useMessageQueue(
  maxSize: number = 100,
  maxAge: number = 5 * 60 * 1000
) {
  const queueRef = useRef<MessageQueue | null>(null);

  if (!queueRef.current) {
    queueRef.current = new MessageQueue(maxSize, maxAge);
  }

  const enqueue = useCallback((event: string, data: unknown) => {
    queueRef.current?.enqueue(event, data);
  }, []);

  const dequeue = useCallback(() => {
    return queueRef.current?.dequeue();
  }, []);

  const dequeueAll = useCallback(() => {
    return queueRef.current?.dequeueAll() || [];
  }, []);

  const getSize = useCallback(() => {
    return queueRef.current?.size() || 0;
  }, []);

  const clear = useCallback(() => {
    queueRef.current?.clear();
  }, []);

  return { enqueue, dequeue, dequeueAll, getSize, clear };
}

// Optimized WebSocket event handler
export function useOptimizedWebSocketHandler<T>(
  onMessage: (messages: T[]) => void,
  options: {
    batchSize?: number;
    batchDelay?: number;
    throttleDelay?: number;
  } = {}
) {
  const { batchSize = 10, batchDelay = 100, throttleDelay = 50 } = options;

  const throttledHandler = useRef<((message: T) => void) | null>(null);
  const { addMessage, flush } = useMessageBatcher(
    onMessage,
    batchSize,
    batchDelay
  );

  // Create throttled handler
  if (!throttledHandler.current) {
    let lastCall = 0;
    throttledHandler.current = (message: T) => {
      const now = Date.now();
      if (now - lastCall >= throttleDelay) {
        addMessage(message);
        lastCall = now;
      }
    };
  }

  const handleMessage = useCallback((message: T) => {
    throttledHandler.current!(message);
  }, []);

  return { handleMessage, flush };
}

// Connection state manager with exponential backoff
export class ConnectionManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private baseDelay: number;
  private maxDelay: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    maxReconnectAttempts: number = 5,
    baseDelay: number = 1000,
    maxDelay: number = 30000
  ) {
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async attemptReconnect(connectFn: () => Promise<void>): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return false;
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts) +
        Math.random() * 1000,
      this.maxDelay
    );

    return new Promise(resolve => {
      this.reconnectTimeout = setTimeout(async () => {
        this.reconnectAttempts++;

        try {
          await connectFn();
          this.reset();
          resolve(true);
        } catch (error) {
          console.error(
            `Reconnection attempt ${this.reconnectAttempts} failed:`,
            error
          );
          const success = await this.attemptReconnect(connectFn);
          resolve(success);
        }
      }, delay);
    });
  }

  reset(): void {
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  cancel(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  getAttempts(): number {
    return this.reconnectAttempts;
  }

  canReconnect(): boolean {
    return this.reconnectAttempts < this.maxReconnectAttempts;
  }
}

// Hook for connection management
export function useConnectionManager(
  connectFn: () => Promise<void>,
  maxReconnectAttempts: number = 5,
  baseDelay: number = 1000,
  maxDelay: number = 30000
) {
  const managerRef = useRef<ConnectionManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new ConnectionManager(
      maxReconnectAttempts,
      baseDelay,
      maxDelay
    );
  }

  const attemptReconnect = useCallback(async () => {
    return managerRef.current!.attemptReconnect(connectFn);
  }, [connectFn]);

  const reset = useCallback(() => {
    managerRef.current?.reset();
  }, []);

  const cancel = useCallback(() => {
    managerRef.current?.cancel();
  }, []);

  const getAttempts = useCallback(() => {
    return managerRef.current?.getAttempts() || 0;
  }, []);

  const canReconnect = useCallback(() => {
    return managerRef.current?.canReconnect() || false;
  }, []);

  useEffect(() => {
    return () => {
      managerRef.current?.cancel();
    };
  }, []);

  return {
    attemptReconnect,
    reset,
    cancel,
    getAttempts,
    canReconnect,
  };
}
