import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OptimizedWebSocketManager } from './websocketOptimization';
import { measureRenderPerformance } from '../test/performance-setup';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.sentMessages.push(data);
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(
        new MessageEvent('message', { data: JSON.stringify(data) })
      );
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocket Optimization Performance', () => {
  let manager: OptimizedWebSocketManager;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new OptimizedWebSocketManager('ws://localhost:8080', {
      maxBatchSize: 5,
      maxWaitTime: 50,
      enablePriority: true,
    });
  });

  afterEach(() => {
    manager.disconnect();
  });

  describe('Message Batching Performance', () => {
    it('should batch multiple messages efficiently', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      const startTime = performance.now();

      // Send multiple messages rapidly
      for (let i = 0; i < 100; i++) {
        manager.send('test', { index: i }, 'normal');
      }

      // Wait for batching to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process messages quickly
      expect(processingTime).toBeLessThan(150);

      // Should have batched messages (fewer than 100 individual sends)
      expect(mockWebSocket.sentMessages.length).toBeLessThan(100);
      expect(mockWebSocket.sentMessages.length).toBeGreaterThan(0);
    });

    it('should handle high-frequency messages without blocking', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      const renderTime = await measureRenderPerformance(async () => {
        // Simulate high-frequency updates (like typing indicators)
        for (let i = 0; i < 1000; i++) {
          manager.send('chat:typing', { userId: 1, typing: true }, 'low');
        }
      });

      // Should handle high-frequency messages without significant delay
      expect(renderTime).toBeLessThan(50);
    });

    it('should prioritize high-priority messages', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      // Send mixed priority messages
      manager.send('low-priority', { data: 'low' }, 'low');
      manager.send('high-priority', { data: 'high' }, 'high');
      manager.send('normal-priority', { data: 'normal' }, 'normal');

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // High priority message should be sent immediately
      expect(mockWebSocket.sentMessages.length).toBeGreaterThan(0);

      const firstMessage = JSON.parse(mockWebSocket.sentMessages[0]);
      expect(firstMessage.type).toBe('high-priority');
    });
  });

  describe('Message Buffering Performance', () => {
    it('should buffer and batch similar message types', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      // Send multiple typing indicators
      for (let i = 0; i < 10; i++) {
        manager.send('chat:typing', { userId: i, typing: true });
      }

      // Simulate receiving buffered messages
      const typingMessages = Array.from({ length: 10 }, (_, i) => ({
        userId: i,
        typing: true,
      }));

      mockWebSocket.simulateMessage({
        type: 'chat:typing',
        data: typingMessages,
      });

      // Should handle buffered messages efficiently
      expect(mockWebSocket.sentMessages.length).toBeGreaterThan(0);
    });

    it('should flush buffers when they reach capacity', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      const messagesSent = [];
      const originalSend = mockWebSocket.send.bind(mockWebSocket);
      mockWebSocket.send = vi.fn(data => {
        messagesSent.push(data);
        originalSend(data);
      });

      // Send enough messages to trigger buffer flush
      for (let i = 0; i < 6; i++) {
        manager.send('chat:typing', { userId: i, typing: true });
      }

      // Wait for buffer processing
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should have flushed buffer due to capacity
      expect(messagesSent.length).toBeGreaterThan(0);
    });
  });

  describe('Connection Management Performance', () => {
    it('should handle connection failures gracefully', async () => {
      const startTime = performance.now();

      // Simulate connection failure
      const failingManager = new OptimizedWebSocketManager('ws://invalid-url');

      try {
        await failingManager.connect();
      } catch (error) {
        // Expected to fail
      }

      const endTime = performance.now();
      const connectionTime = endTime - startTime;

      // Should fail quickly without hanging
      expect(connectionTime).toBeLessThan(1000);

      failingManager.disconnect();
    });

    it('should reconnect efficiently after disconnection', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      // Simulate disconnection
      mockWebSocket.readyState = MockWebSocket.CLOSED;
      mockWebSocket.onclose?.(new CloseEvent('close'));

      // Should attempt reconnection
      expect(manager.getStats().reconnectAttempts).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources properly', async () => {
      await manager.connect();

      // Add listeners
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.on('test', listener1);
      manager.on('test', listener2);
      manager.on('other', listener1);

      // Send some messages to create queue
      for (let i = 0; i < 10; i++) {
        manager.send('test', { data: i });
      }

      const initialStats = manager.getStats();
      expect(initialStats.listeners.length).toBeGreaterThan(0);

      // Disconnect and check cleanup
      manager.disconnect();

      const finalStats = manager.getStats();
      expect(finalStats.queuedMessages).toBe(0);
      expect(finalStats.listeners.length).toBe(0);
      expect(finalStats.isConnected).toBe(false);
    });

    it('should handle memory efficiently with many listeners', async () => {
      await manager.connect();

      const renderTime = await measureRenderPerformance(async () => {
        // Add many listeners
        for (let i = 0; i < 1000; i++) {
          manager.on(`event${i}`, () => {});
        }

        // Remove half of them
        for (let i = 0; i < 500; i++) {
          manager.off(`event${i}`, () => {});
        }
      });

      // Should handle many listeners efficiently
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate performance statistics', async () => {
      await manager.connect();

      // Send some messages
      manager.send('test1', { data: 1 });
      manager.send('test2', { data: 2 });
      manager.send('test3', { data: 3 });

      // Add listeners
      manager.on('test', () => {});
      manager.on('other', () => {});

      const stats = manager.getStats();

      expect(stats).toHaveProperty('queuedMessages');
      expect(stats).toHaveProperty('bufferedTypes');
      expect(stats).toHaveProperty('reconnectAttempts');
      expect(stats).toHaveProperty('isConnected');
      expect(stats).toHaveProperty('listeners');

      expect(typeof stats.queuedMessages).toBe('number');
      expect(Array.isArray(stats.bufferedTypes)).toBe(true);
      expect(Array.isArray(stats.listeners)).toBe(true);
      expect(typeof stats.isConnected).toBe('boolean');
    });
  });

  describe('Stress Testing', () => {
    it('should handle burst of messages without performance degradation', async () => {
      await manager.connect();
      mockWebSocket = (manager as any).socket;

      const startTime = performance.now();

      // Send burst of 10000 messages
      for (let i = 0; i < 10000; i++) {
        manager.send('burst', { index: i }, i % 3 === 0 ? 'high' : 'normal');
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle burst efficiently (less than 1 second)
      expect(processingTime).toBeLessThan(1000);

      // Should have queued messages for batching
      const stats = manager.getStats();
      expect(stats.queuedMessages).toBeGreaterThan(0);
    });

    it('should maintain performance with concurrent operations', async () => {
      await manager.connect();

      const operations = [];

      // Concurrent sending
      operations.push(
        new Promise(resolve => {
          for (let i = 0; i < 100; i++) {
            manager.send('concurrent1', { data: i });
          }
          resolve(undefined);
        })
      );

      // Concurrent listening
      operations.push(
        new Promise(resolve => {
          for (let i = 0; i < 100; i++) {
            manager.on(`event${i}`, () => {});
          }
          resolve(undefined);
        })
      );

      // Concurrent stats checking
      operations.push(
        new Promise(resolve => {
          for (let i = 0; i < 100; i++) {
            manager.getStats();
          }
          resolve(undefined);
        })
      );

      const startTime = performance.now();
      await Promise.all(operations);
      const endTime = performance.now();

      // Should handle concurrent operations efficiently
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
