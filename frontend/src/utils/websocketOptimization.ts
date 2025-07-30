import { useRef, useCallback, useEffect } from 'react';

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
  const batcherRef = useRef<MessageBatcher<T>>();

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
    { callback: Function; lastCall: number; delay: number }
  > = new Map();

  on(event: string, callback: Function, delay: number = 100): void {
    this.events.set(event, { callback, lastCall: 0, delay });
  }

  emit(event: string, ...args: any[]): void {
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
  private queue: Array<{ event: string; data: any; timestamp: number }> = [];
  private readonly maxSize: number;
  private readonly maxAge: number; // in milliseconds

  constructor(maxSize: number = 100, maxAge: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  enqueue(event: string, data: any): void {
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

  dequeue(): { event: string; data: any; timestamp: number } | undefined {
    return this.queue.shift();
  }

  dequeueAll(): Array<{ event: string; data: any; timestamp: number }> {
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
  const queueRef = useRef<MessageQueue>();

  if (!queueRef.current) {
    queueRef.current = new MessageQueue(maxSize, maxAge);
  }

  const enqueue = useCallback((event: string, data: any) => {
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

  const throttledHandler = useRef<Function>();
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
  const managerRef = useRef<ConnectionManager>();

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
