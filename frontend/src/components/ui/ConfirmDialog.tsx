import React from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconTrash,
  IconInfoCircle,
  IconCheck,
} from '@tabler/icons-react';

export interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
  children?: React.ReactNode;
  'data-testid'?: string;
}

const variantConfig = {
  danger: {
    color: 'red',
    icon: IconTrash,
    confirmColor: 'red',
  },
  warning: {
    color: 'yellow',
    icon: IconAlertTriangle,
    confirmColor: 'yellow',
  },
  info: {
    color: 'blue',
    icon: IconInfoCircle,
    confirmColor: 'blue',
  },
  success: {
    color: 'green',
    icon: IconCheck,
    confirmColor: 'green',
  },
};

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  children,
  'data-testid': dataTestId,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color={config.color} variant="light" size="lg">
            <IconComponent size={20} />
          </ThemeIcon>
          <Text fw={600}>{title}</Text>
        </Group>
      }
      centered
      size="sm"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
      data-testid={dataTestId}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {message}
        </Text>

        {children && <div>{children}</div>}

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            color={config.confirmColor}
            onClick={handleConfirm}
            loading={loading}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// Specialized confirm dialog variants
export function DeleteConfirmDialog({
  opened,
  onClose,
  onConfirm,
  itemName,
  loading = false,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Confirmation"
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
    />
  );
}

export function BulkDeleteConfirmDialog({
  opened,
  onClose,
  onConfirm,
  count,
  loading = false,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Bulk Delete Confirmation"
      message={`Are you sure you want to delete ${count} selected item${count > 1 ? 's' : ''}? This action cannot be undone.`}
      confirmLabel={`Delete ${count} item${count > 1 ? 's' : ''}`}
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
    />
  );
}

export function SaveConfirmDialog({
  opened,
  onClose,
  onConfirm,
  hasUnsavedChanges = true,
  loading = false,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasUnsavedChanges?: boolean;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Unsaved Changes"
      message={
        hasUnsavedChanges
          ? 'You have unsaved changes. Do you want to save them before leaving?'
          : 'Do you want to save your changes?'
      }
      confirmLabel="Save Changes"
      cancelLabel="Discard"
      variant="warning"
      loading={loading}
    />
  );
}

export function LogoutConfirmDialog({
  opened,
  onClose,
  onConfirm,
  loading = false,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Logout"
      message="Are you sure you want to log out? You will need to sign in again to access your account."
      confirmLabel="Logout"
      cancelLabel="Stay Logged In"
      variant="info"
      loading={loading}
    />
  );
}
