/**
 * WebSocket optimization utilities for batching and throttling messages
 */

interface QueuedMessage {
  type: string;
  data: any;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  enablePriority: boolean;
}

export class OptimizedWebSocketManager {
  private socket: WebSocket | null = null;
  private messageQueue: QueuedMessage[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  
  private config: BatchConfig = {
    maxBatchSize: 10,
    maxWaitTime: 100,
    enablePriority: true,
  };

  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private messageBuffer: Map<string, any[]> = new Map();

  constructor(private url: string, config?: Partial<BatchConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  connect(): Promise<void> {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.handleReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      
      if (Array.isArray(message)) {
        // Handle batched messages
        message.forEach(msg => this.processMessage(msg));
      } else {
        this.processMessage(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private processMessage(message: any) {
    const { type, data } = message;
    
    // Buffer messages of the same type for batch processing
    if (this.config.enablePriority && this.shouldBuffer(type)) {
      this.bufferMessage(type, data);
    } else {
      this.emitMessage(type, data);
    }
  }

  private shouldBuffer(type: string): boolean {
    // Buffer high-frequency message types
    const bufferableTypes = ['chat:typing', 'notification:update', 'presence:update'];
    return bufferableTypes.includes(type);
  }

  private bufferMessage(type: string, data: any) {
    if (!this.messageBuffer.has(type)) {
      this.messageBuffer.set(type, []);
    }
    
    const buffer = this.messageBuffer.get(type)!;
    buffer.push(data);
    
    // Process buffer when it reaches a certain size or after a timeout
    if (buffer.length >= 5) {
      this.flushBuffer(type);
    } else {
      // Set timeout to flush buffer
      setTimeout(() => this.flushBuffer(type), 50);
    }
  }

  private flushBuffer(type: string) {
    const buffer = this.messageBuffer.get(type);
    if (buffer && buffer.length > 0) {
      this.emitMessage(type, buffer);
      this.messageBuffer.set(type, []);
    }
  }

  private emitMessage(type: string, data: any) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for ${type}:`, error);
        }
      });
    }
  }

  send(type: string, data: any, priority: 'high' | 'normal' | 'low' = 'normal') {
    const message: QueuedMessage = {
      type,
      data,
      timestamp: Date.now(),
      priority,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      if (priority === 'high') {
        // Send high priority messages immediately
        this.sendMessage(message);
      } else {
        // Queue normal and low priority messages for batching
        this.queueMessage(message);
      }
    } else {
      // Queue message if not connected
      this.queueMessage(message);
    }
  }

  private queueMessage(message: QueuedMessage) {
    this.messageQueue.push(message);
    
    // Sort queue by priority and timestamp
    if (this.config.enablePriority) {
      this.messageQueue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
    }

    this.scheduleBatch();
  }

  private scheduleBatch() {
    if (this.batchTimeout) {
      return; // Batch already scheduled
    }

    this.batchTimeout = setTimeout(() => {
      this.flushMessageQueue();
    }, this.config.maxWaitTime);
  }

  private flushMessageQueue() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.messageQueue.length === 0) {
      return;
    }

    const batch = this.messageQueue.splice(0, this.config.maxBatchSize);
    
    if (batch.length === 1) {
      // Send single message
      this.sendMessage(batch[0]);
    } else {
      // Send batch
      this.sendBatch(batch);
    }

    // Schedule next batch if there are more messages
    if (this.messageQueue.length > 0) {
      this.scheduleBatch();
    }
  }

  private sendMessage(message: QueuedMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({
          type: message.type,
          data: message.data,
        }));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        // Re-queue the message
        this.messageQueue.unshift(message);
      }
    }
  }

  private sendBatch(messages: QueuedMessage[]) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const batch = messages.map(msg => ({
          type: msg.type,
          data: msg.data,
        }));
        
        this.socket.send(JSON.stringify({
          type: 'batch',
          data: batch,
        }));
      } catch (error) {
        console.error('Error sending WebSocket batch:', error);
        // Re-queue the messages
        this.messageQueue.unshift(...messages);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  on(type: string, listener: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  off(type: string, listener: (data: any) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  disconnect() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.messageQueue = [];
    this.messageBuffer.clear();
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  // Get connection statistics
  getStats() {
    return {
      queuedMessages: this.messageQueue.length,
      bufferedTypes: Array.from(this.messageBuffer.keys()),
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.socket?.readyState === WebSocket.OPEN,
      listeners: Array.from(this.listeners.keys()),
    };
  }
}

// React hook for optimized WebSocket usage
export function useOptimizedWebSocket(url: string, config?: Partial<BatchConfig>) {
  const managerRef = React.useRef<OptimizedWebSocketManager | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    managerRef.current = new OptimizedWebSocketManager(url, config);
    
    managerRef.current.connect().then(() => {
      setIsConnected(true);
    }).catch(error => {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    });

    return () => {
      managerRef.current?.disconnect();
      setIsConnected(false);
    };
  }, [url]);

  const send = React.useCallback((type: string, data: any, priority?: 'high' | 'normal' | 'low') => {
    managerRef.current?.send(type, data, priority);
  }, []);

  const on = React.useCallback((type: string, listener: (data: any) => void) => {
    managerRef.current?.on(type, listener);
  }, []);

  const off = React.useCallback((type: string, listener: (data: any) => void) => {
    managerRef.current?.off(type, listener);
  }, []);

  return {
    send,
    on,
    off,
    isConnected,
    getStats: () => managerRef.current?.getStats(),
  };
}