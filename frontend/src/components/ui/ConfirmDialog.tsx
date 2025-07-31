import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Group,
  Button,
  Stack,
  ThemeIcon,
  Checkbox,
  TextInput,
  Alert,
  Progress,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconTrash,
  IconInfoCircle,
  IconCheck,
  IconExclamationMark,
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
  requireConfirmation?: boolean;
  confirmationText?: string;
  showDontAskAgain?: boolean;
  onDontAskAgainChange?: (checked: boolean) => void;
  countdown?: number;
  details?: string[];
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
  requireConfirmation = false,
  confirmationText = '',
  showDontAskAgain = false,
  onDontAskAgainChange,
  countdown,
  details,
  'data-testid': dataTestId,
}: ConfirmDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [timeLeft, setTimeLeft] = useState(countdown || 0);

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const isConfirmationValid =
    !requireConfirmation ||
    confirmationInput.toLowerCase() === confirmationText.toLowerCase();

  const canConfirm = isConfirmationValid && (countdown ? timeLeft === 0 : true);

  useEffect(() => {
    if (countdown && countdown > 0 && opened) {
      setTimeLeft(countdown);
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [countdown, opened]);

  useEffect(() => {
    if (!opened) {
      setConfirmationInput('');
      setDontAskAgain(false);
      setTimeLeft(countdown || 0);
    }
  }, [opened, countdown]);

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      if (showDontAskAgain && onDontAskAgainChange) {
        onDontAskAgainChange(dontAskAgain);
      }
    }
  };

  const handleDontAskAgainChange = (checked: boolean) => {
    setDontAskAgain(checked);
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

        {details && details.length > 0 && (
          <Alert
            icon={<IconExclamationMark size={16} />}
            color={config.color}
            variant="light"
          >
            <Stack gap="xs">
              {details.map((detail, index) => (
                <Text key={index} size="sm">
                  • {detail}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        {requireConfirmation && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Type "{confirmationText}" to confirm:
            </Text>
            <TextInput
              value={confirmationInput}
              onChange={e => setConfirmationInput(e.target.value)}
              placeholder={confirmationText}
              error={
                confirmationInput && !isConfirmationValid
                  ? 'Text does not match'
                  : undefined
              }
              disabled={loading}
            />
          </Stack>
        )}

        {countdown && countdown > 0 && (
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Please wait before confirming
              </Text>
              <Text size="sm" fw={500} c={config.color}>
                {timeLeft}s
              </Text>
            </Group>
            <Progress
              value={((countdown - timeLeft) / countdown) * 100}
              color={config.color}
              size="sm"
            />
          </Stack>
        )}

        {children && <div>{children}</div>}

        {showDontAskAgain && (
          <Checkbox
            label="Don't ask me again"
            checked={dontAskAgain}
            onChange={e => handleDontAskAgainChange(e.currentTarget.checked)}
            disabled={loading}
          />
        )}

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
            disabled={!canConfirm}
            autoFocus={canConfirm}
          >
            {confirmLabel}
            {timeLeft > 0 && ` (${timeLeft})`}
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

export function DestructiveActionDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  actionName,
  itemName,
  loading = false,
  requireConfirmation = true,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  actionName: string;
  itemName: string;
  loading?: boolean;
  requireConfirmation?: boolean;
}) {
  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      confirmLabel={actionName}
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
      requireConfirmation={requireConfirmation}
      confirmationText={itemName}
      countdown={3}
      details={[
        'This action cannot be undone',
        'All associated data will be permanently removed',
        'This may affect other parts of the system',
      ]}
    />
  );
}

export function BulkActionDialog({
  opened,
  onClose,
  onConfirm,
  action,
  count,
  itemType,
  loading = false,
  showDontAskAgain = false,
  onDontAskAgainChange,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  count: number;
  itemType: string;
  loading?: boolean;
  showDontAskAgain?: boolean;
  onDontAskAgainChange?: (checked: boolean) => void;
}) {
  const isDestructive = ['delete', 'remove', 'archive'].includes(
    action.toLowerCase()
  );

  return (
    <ConfirmDialog
      opened={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${action} ${count} ${itemType}${count > 1 ? 's' : ''}`}
      message={`Are you sure you want to ${action.toLowerCase()} ${count} selected ${itemType}${count > 1 ? 's' : ''}?`}
      confirmLabel={`${action} ${count} item${count > 1 ? 's' : ''}`}
      cancelLabel="Cancel"
      variant={isDestructive ? 'danger' : 'info'}
      loading={loading}
      showDontAskAgain={showDontAskAgain}
      onDontAskAgainChange={onDontAskAgainChange}
      details={isDestructive ? ['This action cannot be undone'] : undefined}
    />
  );
}
