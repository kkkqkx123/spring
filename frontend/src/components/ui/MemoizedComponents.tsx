import React, { memo, useMemo, useCallback } from 'react';
import { Card, Group, Text, Badge, ActionIcon, Avatar } from '@mantine/core';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';

// Memoized employee card component
interface EmployeeCardProps {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department: { name: string };
    position: { name: string };
    profilePicture?: string;
    status: string;
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
}

export const MemoizedEmployeeCard = memo<EmployeeCardProps>(
  ({ employee, onEdit, onDelete, onView, isSelected, onSelect }) => {
    const handleEdit = useCallback(() => {
      onEdit?.(employee.id);
    }, [onEdit, employee.id]);

    const handleDelete = useCallback(() => {
      onDelete?.(employee.id);
    }, [onDelete, employee.id]);

    const handleView = useCallback(() => {
      onView?.(employee.id);
    }, [onView, employee.id]);

    const handleSelect = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onSelect?.(employee.id, event.target.checked);
      },
      [onSelect, employee.id]
    );

    const fullName = useMemo(
      () => `${employee.firstName} ${employee.lastName}`,
      [employee.firstName, employee.lastName]
    );

    const statusColor = useMemo(() => {
      switch (employee.status) {
        case 'ACTIVE':
          return 'green';
        case 'INACTIVE':
          return 'gray';
        case 'ON_LEAVE':
          return 'yellow';
        case 'TERMINATED':
          return 'red';
        default:
          return 'blue';
      }
    }, [employee.status]);

    return (
      <Card
        padding="md"
        radius="md"
        withBorder
        style={{
          backgroundColor: isSelected
            ? 'var(--mantine-color-blue-0)'
            : undefined,
          borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
        }}
      >
        <Group justify="space-between" mb="xs">
          <Group gap="sm">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelect}
                aria-label={`Select ${fullName}`}
              />
            )}
            <Avatar
              src={employee.profilePicture}
              alt={fullName}
              size="sm"
              radius="xl"
            >
              {employee.firstName[0]}
              {employee.lastName[0]}
            </Avatar>
            <div>
              <Text fw={500} size="sm">
                {fullName}
              </Text>
              <Text size="xs" c="dimmed">
                {employee.email}
              </Text>
            </div>
          </Group>

          <Badge color={statusColor} variant="light" size="sm">
            {employee.status}
          </Badge>
        </Group>

        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" c="dimmed">
              {employee.department.name} • {employee.position.name}
            </Text>
          </div>

          <Group gap="xs">
            {onView && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleView}
                aria-label={`View ${fullName}`}
              >
                <IconEye size={14} />
              </ActionIcon>
            )}
            {onEdit && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleEdit}
                aria-label={`Edit ${fullName}`}
              >
                <IconEdit size={14} />
              </ActionIcon>
            )}
            {onDelete && (
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={handleDelete}
                aria-label={`Delete ${fullName}`}
              >
                <IconTrash size={14} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better memoization
    return (
      prevProps.employee.id === nextProps.employee.id &&
      prevProps.employee.firstName === nextProps.employee.firstName &&
      prevProps.employee.lastName === nextProps.employee.lastName &&
      prevProps.employee.email === nextProps.employee.email &&
      prevProps.employee.department.name ===
        nextProps.employee.department.name &&
      prevProps.employee.position.name === nextProps.employee.position.name &&
      prevProps.employee.profilePicture === nextProps.employee.profilePicture &&
      prevProps.employee.status === nextProps.employee.status &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.onView === nextProps.onView &&
      prevProps.onSelect === nextProps.onSelect
    );
  }
);

MemoizedEmployeeCard.displayName = 'MemoizedEmployeeCard';

// Memoized list item component for chat messages
interface ChatMessageProps {
  message: {
    id: number;
    content: string;
    senderName: string;
    createdAt: string;
    read: boolean;
  };
  isOwn: boolean;
  showSender?: boolean;
}

export const MemoizedChatMessage = memo<ChatMessageProps>(
  ({ message, isOwn, showSender = true }) => {
    const formattedTime = useMemo(() => {
      return new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }, [message.createdAt]);

    return (
      <Group
        align="flex-start"
        gap="sm"
        style={{
          flexDirection: isOwn ? 'row-reverse' : 'row',
          marginBottom: '8px',
        }}
      >
        {showSender && !isOwn && (
          <Avatar size="sm" radius="xl">
            {message.senderName[0]}
          </Avatar>
        )}

        <div style={{ maxWidth: '70%' }}>
          {showSender && !isOwn && (
            <Text size="xs" c="dimmed" mb={2}>
              {message.senderName}
            </Text>
          )}

          <Card
            padding="sm"
            radius="md"
            style={{
              backgroundColor: isOwn
                ? 'var(--mantine-color-blue-6)'
                : 'var(--mantine-color-gray-1)',
              color: isOwn ? 'white' : 'inherit',
            }}
          >
            <Text size="sm">{message.content}</Text>
            <Text
              size="xs"
              style={{
                opacity: 0.7,
                marginTop: '4px',
                textAlign: 'right',
              }}
            >
              {formattedTime}
            </Text>
          </Card>
        </div>
      </Group>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.senderName === nextProps.message.senderName &&
      prevProps.message.createdAt === nextProps.message.createdAt &&
      prevProps.message.read === nextProps.message.read &&
      prevProps.isOwn === nextProps.isOwn &&
      prevProps.showSender === nextProps.showSender
    );
  }
);

MemoizedChatMessage.displayName = 'MemoizedChatMessage';

// Memoized notification item
interface NotificationItemProps {
  notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  };
  onClick?: (id: number) => void;
  onMarkAsRead?: (id: number) => void;
}

export const MemoizedNotificationItem = memo<NotificationItemProps>(
  ({ notification, onClick, onMarkAsRead }) => {
    const handleClick = useCallback(() => {
      onClick?.(notification.id);
      if (!notification.read) {
        onMarkAsRead?.(notification.id);
      }
    }, [onClick, onMarkAsRead, notification.id, notification.read]);

    const typeColor = useMemo(() => {
      switch (notification.type) {
        case 'success':
          return 'green';
        case 'warning':
          return 'yellow';
        case 'error':
          return 'red';
        case 'info':
          return 'blue';
        default:
          return 'gray';
      }
    }, [notification.type]);

    const timeAgo = useMemo(() => {
      const now = new Date();
      const created = new Date(notification.createdAt);
      const diffInMinutes = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }, [notification.createdAt]);

    return (
      <Card
        padding="md"
        radius="md"
        withBorder
        style={{
          cursor: 'pointer',
          backgroundColor: notification.read
            ? undefined
            : 'var(--mantine-color-blue-0)',
          borderLeft: `4px solid var(--mantine-color-${typeColor}-6)`,
        }}
        onClick={handleClick}
      >
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <Text fw={500} size="sm">
                {notification.title}
              </Text>
              {!notification.read && (
                <Badge size="xs" color="blue" variant="filled">
                  New
                </Badge>
              )}
            </Group>

            <Text size="sm" c="dimmed" lineClamp={2}>
              {notification.message}
            </Text>
          </div>

          <Text size="xs" c="dimmed">
            {timeAgo}
          </Text>
        </Group>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.notification.id === nextProps.notification.id &&
      prevProps.notification.title === nextProps.notification.title &&
      prevProps.notification.message === nextProps.notification.message &&
      prevProps.notification.type === nextProps.notification.type &&
      prevProps.notification.read === nextProps.notification.read &&
      prevProps.notification.createdAt === nextProps.notification.createdAt &&
      prevProps.onClick === nextProps.onClick &&
      prevProps.onMarkAsRead === nextProps.onMarkAsRead
    );
  }
);

MemoizedNotificationItem.displayName = 'MemoizedNotificationItem';
