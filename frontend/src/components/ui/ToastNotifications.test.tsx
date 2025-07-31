import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { ToastNotification, ToastContainer, useToast, useProgressToast } from './ToastNotifications';
import { useUiStore } from '../../stores/uiStore';

// Mock the UI store
vi.mock('../../stores/uiStore', () => ({
  useUiStore: vi.fn(),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ToastNotification', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders success notification correctly', () => {
    render(
      <TestWrapper>
        <ToastNotification
          id="test-1"
          type="success"
          title="Success"
          message="Operation completed successfully"
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('renders error notification correctly', () => {
    render(
      <TestWrapper>
        <ToastNotification
          id="test-2"
          type="error"
          title="Error"
          message="Something went wrong"
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders warning notification correctly', () => {
    render(
      <TestWrapper>
        <ToastNotification
          id="test-3"
          type="warning"
          title="Warning"
          message="Please check your input"
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Please check your input')).toBeInTheDocument();
  });

  it('renders info notification correctly', () => {
    render(
      <TestWrapper>
        <ToastNotification
          id="test-4"
          type="info"
          title="Info"
          message="Here's some information"
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText("Here's some information")).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <TestWrapper>
        <ToastNotification
          id="test-5"
          type="success"
          title="Success"
          message="Test message"
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('test-5');
  });

  it('shows progress bar when progress is provided', () => {
    render(
      <TestWrapper>
        <ToastNotification
          id="test-6"
          type="info"
          title="Progress"
          message="Loading..."
          progress={50}
          autoClose={false}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows action button when action is provided', () => {
    const mockAction = vi.fn();
    
    render(
      <TestWrapper>
        <ToastNotification
          id="test-7"
          type="info"
          title="Info"
          message="Test message"
          action={{
            label: 'Retry',
            onClick: mockAction,
          }}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });

  it('auto-closes after specified duration', async () => {
    vi.useFakeTimers();

    render(
      <TestWrapper>
        <ToastNotification
          id="test-8"
          type="success"
          title="Success"
          message="Auto close test"
          autoClose={true}
          duration={1000}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-8');
    });

    vi.useRealTimers();
  });

  it('pauses auto-close on mouse enter and resumes on mouse leave', async () => {
    vi.useFakeTimers();

    render(
      <TestWrapper>
        <ToastNotification
          id="test-9"
          type="success"
          title="Success"
          message="Pause test"
          autoClose={true}
          duration={1000}
          onClose={mockOnClose}
        />
      </TestWrapper>
    );

    const notification = screen.getByRole('alert');
    
    // Start timer
    vi.advanceTimersByTime(500);
    
    // Pause on mouse enter
    fireEvent.mouseEnter(notification);
    vi.advanceTimersByTime(1000);
    
    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Resume on mouse leave
    fireEvent.mouseLeave(notification);
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-9');
    });

    vi.useRealTimers();
  });
});

describe('ToastContainer', () => {
  const mockRemoveNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUiStore as any).mockReturnValue({
      notifications: [
        {
          id: '1',
          type: 'success',
          title: 'Success',
          message: 'Test success message',
          autoClose: true,
          duration: 5000,
        },
        {
          id: '2',
          type: 'error',
          title: 'Error',
          message: 'Test error message',
          autoClose: false,
        },
      ],
      removeNotification: mockRemoveNotification,
    });
  });

  it('renders all notifications from store', () => {
    render(
      <TestWrapper>
        <ToastContainer />
      </TestWrapper>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Test success message')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders empty container when no notifications', () => {
    (useUiStore as any).mockReturnValue({
      notifications: [],
      removeNotification: mockRemoveNotification,
    });

    const { container } = render(
      <TestWrapper>
        <ToastContainer />
      </TestWrapper>
    );

    expect(container.firstChild?.firstChild).toBeEmptyDOMElement();
  });
});

describe('useToast hook', () => {
  const mockAddNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUiStore as any).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  it('provides toast methods', () => {
    const TestComponent = () => {
      const toast = useToast();
      
      return (
        <div>
          <button onClick={() => toast.success('Success', 'Success message')}>
            Success
          </button>
          <button onClick={() => toast.error('Error', 'Error message')}>
            Error
          </button>
          <button onClick={() => toast.warning('Warning', 'Warning message')}>
            Warning
          </button>
          <button onClick={() => toast.info('Info', 'Info message')}>
            Info
          </button>
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Success'));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Success',
      message: 'Success message',
    });

    fireEvent.click(screen.getByText('Error'));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Error message',
      autoClose: false,
    });

    fireEvent.click(screen.getByText('Warning'));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'warning',
      title: 'Warning',
      message: 'Warning message',
    });

    fireEvent.click(screen.getByText('Info'));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'info',
      title: 'Info',
      message: 'Info message',
    });
  });
});

describe('useProgressToast hook', () => {
  const mockAddNotification = vi.fn();
  const mockRemoveNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUiStore as any).mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: mockRemoveNotification,
    });
  });

  it('creates and manages progress toast', () => {
    const TestComponent = () => {
      const { showProgressToast } = useProgressToast();
      
      const handleStart = () => {
        const progress = showProgressToast('Upload', 'Uploading file...', 0);
        
        // Simulate progress updates
        setTimeout(() => progress.updateProgress(50, 'Halfway done...'), 100);
        setTimeout(() => progress.complete('Upload completed!'), 200);
      };

      return (
        <button onClick={handleStart}>
          Start Progress
        </button>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Start Progress'));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Upload',
        message: 'Uploading file...',
        autoClose: false,
        progress: 0,
      })
    );
  });
});