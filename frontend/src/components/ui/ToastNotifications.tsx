import React, { useEffect } from 'react';
import {
  Notification,
  Group,
  ActionIcon,
  Text,
  Progress,
  Stack,
  Box,
  Portal,
  Transition,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconBulb,
} from '@tabler/icons-react';
import { useUiStore } from '../../stores/uiStore';

interface ToastNotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  onClose: (id: string) => void;
}

const getNotificationIcon = (type: ToastNotificationProps['type']) => {
  switch (type) {
    case 'success':
      return <IconCheck size={20} />;
    case 'error':
      return <IconX size={20} />;
    case 'warning':
      return <IconAlertTriangle size={20} />;
    case 'info':
      return <IconInfoCircle size={20} />;
    default:
      return <IconBulb size={20} />;
  }
};

const getNotificationColor = (type: ToastNotificationProps['type']) => {
  switch (type) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type,
  title,
  message,
  autoClose = true,
  duration = 5000,
  action,
  progress,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = React.useState(duration);
  const [isPaused, setIsPaused] = React.useState(false);

  useEffect(() => {
    if (!autoClose || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          onClose(id);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoClose, isPaused, id, onClose]);

  const handleClose = () => {
    onClose(id);
  };

  const progressValue = autoClose
    ? ((duration - timeLeft) / duration) * 100
    : progress;

  return (
    <Notification
      icon={getNotificationIcon(type)}
      color={getNotificationColor(type)}
      title={title}
      onClose={handleClose}
      style={{
        marginBottom: '0.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: `1px solid var(--mantine-color-${getNotificationColor(type)}-3)`,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Stack gap="xs">
        <Text size="sm">{message}</Text>

        {action && (
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              color={getNotificationColor(type)}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </ActionIcon>
          </Group>
        )}

        {(autoClose || typeof progress === 'number') && (
          <Progress
            value={progressValue}
            size="xs"
            color={getNotificationColor(type)}
            style={{ marginTop: '0.25rem' }}
          />
        )}
      </Stack>
    </Notification>
  );
};

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useUiStore();

  return (
    <Portal>
      <Box
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 10000,
          maxWidth: '400px',
          width: '100%',
        }}
      >
        {notifications.map(notification => (
          <Transition
            key={notification.id}
            mounted={true}
            transition="slide-left"
            duration={300}
            timingFunction="ease"
          >
            {styles => (
              <div style={styles}>
                <ToastNotification
                  {...notification}
                  onClose={removeNotification}
                />
              </div>
            )}
          </Transition>
        ))}
      </Box>
    </Portal>
  );
};

// Hook for easy toast notifications
export const useToast = () => {
  const { addNotification } = useUiStore();

  const showToast = React.useCallback(
    (
      type: 'success' | 'error' | 'warning' | 'info',
      title: string,
      message: string,
      options?: {
        autoClose?: boolean;
        duration?: number;
        action?: {
          label: string;
          onClick: () => void;
        };
      }
    ) => {
      addNotification({
        type,
        title,
        message,
        autoClose: options?.autoClose,
        duration: options?.duration,
        ...options,
      });
    },
    [addNotification]
  );

  const success = React.useCallback(
    (title: string, message: string, options?: any) => {
      showToast('success', title, message, options);
    },
    [showToast]
  );

  const error = React.useCallback(
    (title: string, message: string, options?: any) => {
      showToast('error', title, message, { ...options, autoClose: false });
    },
    [showToast]
  );

  const warning = React.useCallback(
    (title: string, message: string, options?: any) => {
      showToast('warning', title, message, options);
    },
    [showToast]
  );

  const info = React.useCallback(
    (title: string, message: string, options?: any) => {
      showToast('info', title, message, options);
    },
    [showToast]
  );

  return {
    showToast,
    success,
    error,
    warning,
    info,
  };
};

// Progress toast for long-running operations
export const useProgressToast = () => {
  const { addNotification, removeNotification } = useUiStore();

  const showProgressToast = React.useCallback(
    (title: string, message: string, initialProgress: number = 0) => {
      const id = Math.random().toString(36).substr(2, 9);

      addNotification({
        id,
        type: 'info',
        title,
        message,
        autoClose: false,
        progress: initialProgress,
      } as any);

      const updateProgress = (progress: number, newMessage?: string) => {
        removeNotification(id);
        addNotification({
          id,
          type: 'info',
          title,
          message: newMessage || message,
          autoClose: false,
          progress,
        } as any);
      };

      const complete = (successMessage?: string) => {
        removeNotification(id);
        addNotification({
          type: 'success',
          title: 'Completed',
          message: successMessage || 'Operation completed successfully',
          autoClose: true,
          duration: 3000,
        });
      };

      const fail = (errorMessage?: string) => {
        removeNotification(id);
        addNotification({
          type: 'error',
          title: 'Failed',
          message: errorMessage || 'Operation failed',
          autoClose: false,
        });
      };

      return {
        id,
        updateProgress,
        complete,
        fail,
        close: () => removeNotification(id),
      };
    },
    [addNotification, removeNotification]
  );

  return { showProgressToast };
};
