import React, { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Switch,
  Group,
  Card,
  Divider,
  Select,
  Button,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { NotificationType } from '../../../types';

export interface NotificationPreferences {
  emailNotifications: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
  notificationTypes: {
    [K in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

export interface NotificationSettingsProps {
  preferences?: NotificationPreferences;
  onSave?: (preferences: NotificationPreferences) => void;
  loading?: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  browserNotifications: true,
  soundEnabled: true,
  notificationTypes: {
    info: true,
    success: true,
    warning: true,
    error: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  frequency: 'immediate',
};

export function NotificationSettings({
  preferences = defaultPreferences,
  onSave,
  loading = false,
}: NotificationSettingsProps) {
  const [settings, setSettings] =
    useState<NotificationPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNotificationType = (type: NotificationType, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: enabled,
      },
    }));
    setHasChanges(true);
  };

  const updateQuietHours = (
    key: keyof NotificationPreferences['quietHours'],
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(preferences);
    setHasChanges(false);
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={3} mb="xs">
          Notification Settings
        </Title>
        <Text size="sm" c="dimmed">
          Customize how and when you receive notifications
        </Text>
      </div>

      {/* General Settings */}
      <Card withBorder>
        <Title order={4} mb="md">
          General Settings
        </Title>

        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Email Notifications
              </Text>
              <Text size="xs" c="dimmed">
                Receive notifications via email
              </Text>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onChange={event =>
                updateSetting('emailNotifications', event.currentTarget.checked)
              }
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Browser Notifications
              </Text>
              <Text size="xs" c="dimmed">
                Show desktop notifications in your browser
              </Text>
            </div>
            <Switch
              checked={settings.browserNotifications}
              onChange={event =>
                updateSetting(
                  'browserNotifications',
                  event.currentTarget.checked
                )
              }
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Sound Notifications
              </Text>
              <Text size="xs" c="dimmed">
                Play sound when receiving notifications
              </Text>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onChange={event =>
                updateSetting('soundEnabled', event.currentTarget.checked)
              }
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Notification Frequency
              </Text>
              <Text size="xs" c="dimmed">
                How often to receive notifications
              </Text>
            </div>
            <Select
              value={settings.frequency}
              onChange={value =>
                updateSetting(
                  'frequency',
                  value as NotificationPreferences['frequency']
                )
              }
              data={[
                { value: 'immediate', label: 'Immediate' },
                { value: 'hourly', label: 'Hourly digest' },
                { value: 'daily', label: 'Daily digest' },
              ]}
              w={150}
            />
          </Group>
        </Stack>
      </Card>

      {/* Notification Types */}
      <Card withBorder>
        <Title order={4} mb="md">
          Notification Types
        </Title>

        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Information
              </Text>
              <Text size="xs" c="dimmed">
                General information and updates
              </Text>
            </div>
            <Switch
              checked={settings.notificationTypes.info}
              onChange={event =>
                updateNotificationType('info', event.currentTarget.checked)
              }
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Success
              </Text>
              <Text size="xs" c="dimmed">
                Successful operations and completions
              </Text>
            </div>
            <Switch
              checked={settings.notificationTypes.success}
              onChange={event =>
                updateNotificationType('success', event.currentTarget.checked)
              }
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Warnings
              </Text>
              <Text size="xs" c="dimmed">
                Important warnings and alerts
              </Text>
            </div>
            <Switch
              checked={settings.notificationTypes.warning}
              onChange={event =>
                updateNotificationType('warning', event.currentTarget.checked)
              }
            />
          </Group>

          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Errors
              </Text>
              <Text size="xs" c="dimmed">
                Error messages and failures
              </Text>
            </div>
            <Switch
              checked={settings.notificationTypes.error}
              onChange={event =>
                updateNotificationType('error', event.currentTarget.checked)
              }
            />
          </Group>
        </Stack>
      </Card>

      {/* Quiet Hours */}
      <Card withBorder>
        <Title order={4} mb="md">
          Quiet Hours
        </Title>

        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500}>
                Enable Quiet Hours
              </Text>
              <Text size="xs" c="dimmed">
                Suppress notifications during specified hours
              </Text>
            </div>
            <Switch
              checked={settings.quietHours.enabled}
              onChange={event =>
                updateQuietHours('enabled', event.currentTarget.checked)
              }
            />
          </Group>

          {settings.quietHours.enabled && (
            <>
              <Group>
                <Select
                  label="Start Time"
                  value={settings.quietHours.start}
                  onChange={value => updateQuietHours('start', value)}
                  data={Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return { value: `${hour}:00`, label: `${hour}:00` };
                  })}
                  w={120}
                />
                <Select
                  label="End Time"
                  value={settings.quietHours.end}
                  onChange={value => updateQuietHours('end', value)}
                  data={Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return { value: `${hour}:00`, label: `${hour}:00` };
                  })}
                  w={120}
                />
              </Group>

              <Alert
                icon={<IconInfoCircle size={16} />}
                color="blue"
                variant="light"
              >
                Quiet hours will suppress browser and sound notifications, but
                email notifications will still be sent.
              </Alert>
            </>
          )}
        </Stack>
      </Card>

      {/* Action Buttons */}
      <Group justify="flex-end">
        <Button
          variant="subtle"
          onClick={handleReset}
          disabled={!hasChanges || loading}
        >
          Reset
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges} loading={loading}>
          Save Settings
        </Button>
      </Group>
    </Stack>
  );
}
