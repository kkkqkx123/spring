import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus, WebSocketService } from './websocket';
import { storage } from '../utils';
import { STORAGE_KEYS } from '../constants';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock storage
vi.mock('../utils', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('subscribe and emit', () => {
    it('should subscribe to events and receive emissions', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.subscribe('connect', callback);

      eventBus.emit('connect');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple subscribers for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.subscribe('connect', callback1);
      eventBus.subscribe('connect', callback2);

      eventBus.emit('connect');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to event callbacks', () => {
      const callback = vi.fn();
      eventBus.subscribe('chat:new-message', callback);

      const message = { id: 1, content: 'test', senderId: 1, recipientId: 2 };
      eventBus.emit('chat:new-message', message as any);

      expect(callback).toHaveBeenCalledWith(message);
    });

    it('should handle errors in event callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      eventBus.subscribe('connect', errorCallback);
      eventBus.subscribe('connect', normalCallback);

      // Should not throw
      expect(() => eventBus.emit('connect')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe using returned function', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.subscribe('connect', callback);

      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should unsubscribe using direct method', () => {
      const callback = vi.fn();
      eventBus.subscribe('connect', callback);

      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1);

      eventBus.unsubscribe('connect', callback);
      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('utility methods', () => {
    it('should return correct listener count', () => {
      expect(eventBus.getListenerCount('connect')).toBe(0);

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      eventBus.subscribe('connect', callback1);
      eventBus.subscribe('connect', callback2);

      expect(eventBus.getListenerCount('connect')).toBe(2);
    });

    it('should clear all listeners', () => {
      const callback = vi.fn();
      eventBus.subscribe('connect', callback);
      eventBus.subscribe('disconnect', callback);

      expect(eventBus.getListenerCount('connect')).toBe(1);
      expect(eventBus.getListenerCount('disconnect')).toBe(1);

      eventBus.clear();

      expect(eventBus.getListenerCount('connect')).toBe(0);
      expect(eventBus.getListenerCount('disconnect')).toBe(0);
    });
  });
});

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let eventBus: EventBus;

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus = new EventBus();
    webSocketService = new WebSocketService(eventBus);
    mockSocket.connected = false;
  });

  afterEach(() => {
    webSocketService.disconnect();
  });

  describe('connection management', () => {
    it('should require auth token to connect', async () => {
      vi.mocked(storage.get).mockReturnValue(null);

      await expect(webSocketService.connect()).rejects.toThrow(
        'No authentication token available'
      );
    });

    it('should connect with valid auth token', async () => {
      vi.mocked(storage.get).mockReturnValue('valid-token');

      // Mock successful connection
      const connectPromise = webSocketService.connect();

      // Simulate socket connection
      mockSocket.connected = true;
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      if (connectHandler) {
        connectHandler();
      }

      await expect(connectPromise).resolves.toBeUndefined();
    });

    it('should handle connection errors', async () => {
      vi.mocked(storage.get).mockReturnValue('valid-token');

      const connectPromise = webSocketService.connect();

      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      if (errorHandler) {
        errorHandler(new Error('Connection failed'));
      }

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });

    it('should return connection state correctly', () => {
      expect(webSocketService.getConnectionState()).toBe('disconnected');
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should disconnect properly', () => {
      // First simulate a connection
      (webSocketService as any).socket = mockSocket;

      webSocketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(webSocketService.isConnected()).toBe(false);
    });
  });

  describe('chat functionality', () => {
    beforeEach(async () => {
      vi.mocked(storage.get).mockReturnValue('valid-token');
      mockSocket.connected = true;
      // Simulate connected socket
      (webSocketService as any).socket = mockSocket;
    });

    it('should send chat messages', () => {
      webSocketService.sendChatMessage(123, 'Hello world');

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:send-message', {
        recipientId: 123,
        content: 'Hello world',
        timestamp: expect.any(String),
      });
    });

    it('should mark messages as read', () => {
      webSocketService.markMessageAsRead(456);

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:mark-read', {
        messageId: 456,
      });
    });

    it('should send typing indicators', () => {
      webSocketService.sendTypingIndicator(789, true);

      expect(mockSocket.emit).toHaveBeenCalledWith('chat:typing', {
        recipientId: 789,
        isTyping: true,
      });
    });

    it('should throw error when not connected for critical operations', () => {
      mockSocket.connected = false;

      expect(() => webSocketService.sendChatMessage(123, 'test')).toThrow(
        'WebSocket not connected'
      );
      expect(() => webSocketService.markMessageAsRead(456)).toThrow(
        'WebSocket not connected'
      );
    });

    it('should not throw error for typing indicators when not connected', () => {
      mockSocket.connected = false;

      expect(() =>
        webSocketService.sendTypingIndicator(789, true)
      ).not.toThrow();
    });
  });

  describe('notification functionality', () => {
    beforeEach(() => {
      vi.mocked(storage.get).mockReturnValue('valid-token');
      mockSocket.connected = true;
      // Simulate connected socket
      (webSocketService as any).socket = mockSocket;
    });

    it('should mark notifications as read', () => {
      webSocketService.markNotificationAsRead(123);

      expect(mockSocket.emit).toHaveBeenCalledWith('notification:mark-read', {
        notificationId: 123,
      });
    });

    it('should throw error when not connected', () => {
      mockSocket.connected = false;

      expect(() => webSocketService.markNotificationAsRead(123)).toThrow(
        'WebSocket not connected'
      );
    });
  });

  describe('ping functionality', () => {
    beforeEach(() => {
      vi.mocked(storage.get).mockReturnValue('valid-token');
      mockSocket.connected = true;
      // Simulate connected socket
      (webSocketService as any).socket = mockSocket;
    });

    it('should measure ping latency', async () => {
      const pingPromise = webSocketService.ping();

      // Simulate ping response
      const emitCall = mockSocket.emit.mock.calls.find(
        call => call[0] === 'ping'
      );
      if (emitCall && emitCall[2]) {
        // Call the callback with the original timestamp
        setTimeout(() => emitCall[2](emitCall[1]), 10);
      }

      const latency = await pingPromise;
      expect(typeof latency).toBe('number');
      expect(latency).toBeGreaterThanOrEqual(0);
    });

    it('should timeout ping requests', async () => {
      const pingPromise = webSocketService.ping();

      // Don't call the callback to simulate timeout
      await expect(pingPromise).rejects.toThrow('Ping timeout');
    }, 6000);

    it('should throw error when not connected', async () => {
      mockSocket.connected = false;

      await expect(webSocketService.ping()).rejects.toThrow(
        'WebSocket not connected'
      );
    });
  });

  describe('event subscription', () => {
    it('should subscribe to events through service', () => {
      const callback = vi.fn();
      const unsubscribe = webSocketService.subscribe('connect', callback);

      eventBus.emit('connect');
      expect(callback).toHaveBeenCalled();

      unsubscribe();
      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe from events through service', () => {
      const callback = vi.fn();
      webSocketService.subscribe('connect', callback);

      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1);

      webSocketService.unsubscribe('connect', callback);
      eventBus.emit('connect');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
