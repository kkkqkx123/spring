/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi, beforeEach, afterEach } from 'vitest';
import {
  NotificationProvider,
  useNotificationContext,
  ConnectionStatus,
} from './NotificationProvider';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { webSocketService } from '../../../services/websocket';
import { useNotificationStore } from '../../../stores/notificationStore';
import { notificationApi } from '../services/notificationApi';
import { notifications } from '@mantine/notifications';

// Mock dependencies
vi.mock('../hooks/useRealTimeNotifications');
vi.mock('../../../services/websocket');
vi.mock('../../../stores/notificationStore');
vi.mock('../services/notificationApi');
vi.mock('@mantine/notifications');

const mockRealTimeNotifications = {
  isConnected: true,
  connectionState: 'connected' as const,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  archiveNotification: vi.fn(),
  cleanupOldNotifications: vi.fn(),
};

const mockNotificationStore = {
  setNotifications: vi.fn(),
  setLoading: vi.fn(),
};

const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribe: vi.fn(),
};

const mockNotificationApi = {
  getNotifications: vi.fn(),
};

const mockNotifications = {
  show: vi.fn(),
};

const TestComponent = () => {
  const context = useNotificationContext();
  return (
    <div>
      <div data-testid="connection-state">{context.connectionState}</div>
      <div data-testid="is-connected">{context.isConnected.toString()}</div>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement, props = {}) => {
  return render(
    <MantineProvider>
      <NotificationProvider {...props}>{component}</NotificationProvider>
    </MantineProvider>
  );
};

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useRealTimeNotifications as any).mockReturnValue(
      mockRealTimeNotifications
    );
    (useNotificationStore as any).mockReturnValue(mockNotificationStore);
    (webSocketService as any).connect = mockWebSocketService.connect;
    (webSocketService as any).disconnect = mockWebSocketService.disconnect;
    (webSocketService as any).subscribe = mockWebSocketService.subscribe;
    (notificationApi as any).getNotifications =
      mockNotificationApi.getNotifications;
    (notifications as any).show = mockNotifications.show;

    // Mock successful API response
    mockNotificationApi.getNotifications.mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    // Mock WebSocket connection
    mockWebSocketService.connect.mockResolvedValue(undefined);
    mockWebSocketService.subscribe.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides notification context to children', () => {
    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('connection-state')).toHaveTextContent(
      'connected'
    );
    expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
  });

  it('throws error when useNotificationContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <MantineProvider>
          <TestComponent />
        </MantineProvider>
      );
    }).toThrow(
      'useNotificationContext must be used within a NotificationProvider'
    );

    consoleSpy.mockRestore();
  });

  it('auto-connects WebSocket when autoConnect is true', async () => {
    renderWithProvider(<TestComponent />, { autoConnect: true });

    await waitFor(() => {
      expect(mockWebSocketService.connect).toHaveBeenCalled();
      expect(mockNotificationApi.getNotifications).toHaveBeenCalledWith({
        page: 0,
        size: 50,
      });
    });
  });

  it('does not auto-connect when autoConnect is false', () => {
    renderWithProvider(<TestComponent />, { autoConnect: false });

    expect(mockWebSocketService.connect).not.toHaveBeenCalled();
    expect(mockNotificationApi.getNotifications).not.toHaveBeenCalled();
  });

  it('loads initial notifications on connection', async () => {
    const mockNotifications = [
      {
        id: 1,
        title: 'Test',
        message: 'Test message',
        type: 'info',
        userId: 1,
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    mockNotificationApi.getNotifications.mockResolvedValue({
      content: mockNotifications,
      totalElements: 1,
    });

    renderWithProvider(<TestComponent />);

    await waitFor(() => {
      expect(mockNotificationStore.setNotifications).toHaveBeenCalledWith(
        mockNotifications
      );
    });
  });

  it('handles connection errors gracefully', async () => {
    mockWebSocketService.connect.mockRejectedValue(
      new Error('Connection failed')
    );

    renderWithProvider(<TestComponent />, { showConnectionStatus: true });

    await waitFor(() => {
      expect(mockNotifications.show).toHaveBeenCalledWith({
        title: 'Connection Error',
        message: 'Failed to connect to notification service',
        color: 'red',
      });
    });
  });

  it('sets loading state during initialization', async () => {
    renderWithProvider(<TestComponent />);

    await waitFor(() => {
      expect(mockNotificationStore.setLoading).toHaveBeenCalledWith(true);
    });

    await waitFor(() => {
      expect(mockNotificationStore.setLoading).toHaveBeenCalledWith(false);
    });
  });

  it('subscribes to WebSocket events when showConnectionStatus is true', () => {
    renderWithProvider(<TestComponent />, { showConnectionStatus: true });

    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'connect',
      expect.any(Function)
    );
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function)
    );
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'reconnect',
      expect.any(Function)
    );
    expect(mockWebSocketService.subscribe).toHaveBeenCalledWith(
      'reconnect_failed',
      expect.any(Function)
    );
  });

  it('does not subscribe to connection events when showConnectionStatus is false', () => {
    renderWithProvider(<TestComponent />, { showConnectionStatus: false });

    // Should still be called for the real-time notifications hook, but not for connection status
    const connectCalls = mockWebSocketService.subscribe.mock.calls.filter(
      call => call[0] === 'connect'
    );
    expect(connectCalls.length).toBe(0);
  });

  it('disconnects WebSocket on unmount', () => {
    const { unmount } = renderWithProvider(<TestComponent />);

    unmount();

    expect(mockWebSocketService.disconnect).toHaveBeenCalled();
  });
});

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRealTimeNotifications as any).mockReturnValue(
      mockRealTimeNotifications
    );
    (useNotificationStore as any).mockReturnValue(mockNotificationStore);
    (webSocketService as any).connect = mockWebSocketService.connect;
    (webSocketService as any).disconnect = mockWebSocketService.disconnect;
    (webSocketService as any).subscribe = mockWebSocketService.subscribe;
    (notificationApi as any).getNotifications =
      mockNotificationApi.getNotifications;

    mockNotificationApi.getNotifications.mockResolvedValue({ content: [] });
    mockWebSocketService.connect.mockResolvedValue(undefined);
    mockWebSocketService.subscribe.mockReturnValue(() => {});
  });

  it('displays connected status', () => {
    renderWithProvider(<ConnectionStatus />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('displays connecting status', () => {
    (useRealTimeNotifications as any).mockReturnValue({
      ...mockRealTimeNotifications,
      connectionState: 'connecting',
    });

    renderWithProvider(<ConnectionStatus />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('displays disconnected status', () => {
    (useRealTimeNotifications as any).mockReturnValue({
      ...mockRealTimeNotifications,
      connectionState: 'disconnected',
      isConnected: false,
    });

    renderWithProvider(<ConnectionStatus />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProvider(
      <ConnectionStatus className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
