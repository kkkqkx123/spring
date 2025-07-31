import React, { useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Group,
  Text,
  Button,
  Avatar,
  Badge,
  Divider,
  Grid,
  TextInput,
  PasswordInput,
  Switch,
  Select,
  Textarea,
  FileInput,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconBuilding,
  IconEdit,
  IconCheck,
  IconX,
  IconCamera,
  IconShield,
  IconBell,
  IconPalette,
  IconLanguage,
} from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferencesData {
  theme: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  chatNotifications: boolean;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'security' | 'preferences'
  >('profile');

  const profileForm = useForm<ProfileFormData>({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    },
    validate: {
      firstName: value =>
        value.length < 2 ? 'First name must be at least 2 characters' : null,
      lastName: value =>
        value.length < 2 ? 'Last name must be at least 2 characters' : null,
      email: value => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const securityForm = useForm<SecurityFormData>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: value =>
        value.length < 1 ? 'Current password is required' : null,
      newPassword: value =>
        value.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Passwords do not match' : null,
    },
  });

  const preferencesForm = useForm<PreferencesData>({
    initialValues: {
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
      chatNotifications: true,
    },
  });

  const handleProfileSubmit = (_values: ProfileFormData) => {
    // Simulate API call
    setTimeout(() => {
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setIsEditingProfile(false);
    }, 1000);
  };

  const handleSecuritySubmit = (_values: SecurityFormData) => {
    // Simulate API call
    setTimeout(() => {
      notifications.show({
        title: 'Success',
        message: 'Password updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setIsEditingSecurity(false);
      securityForm.reset();
    }, 1000);
  };

  const handlePreferencesSubmit = (_values: PreferencesData) => {
    // Simulate API call
    setTimeout(() => {
      notifications.show({
        title: 'Success',
        message: 'Preferences updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    }, 1000);
  };

  const renderProfileTab = () => (
    <Card padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Text size="lg" fw={600}>
          Profile Information
        </Text>
        {!isEditingProfile ? (
          <Button
            leftSection={<IconEdit size={16} />}
            variant="light"
            onClick={() => setIsEditingProfile(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Group gap="sm">
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={() => profileForm.onSubmit(handleProfileSubmit)()}
            >
              Save Changes
            </Button>
            <Button
              leftSection={<IconX size={16} />}
              variant="outline"
              onClick={() => {
                setIsEditingProfile(false);
                profileForm.reset();
              }}
            >
              Cancel
            </Button>
          </Group>
        )}
      </Group>

      <Stack gap="lg">
        {/* Profile Picture */}
        <Group align="center" gap="lg">
          <Avatar
            src={user?.profilePicture}
            size={80}
            radius="md"
            alt={`${user?.firstName} ${user?.lastName}`}
          >
            <IconUser size={40} />
          </Avatar>
          {isEditingProfile && (
            <Stack gap="xs">
              <FileInput
                placeholder="Choose profile picture"
                accept="image/*"
                leftSection={<IconCamera size={16} />}
              />
              <Text size="xs" c="dimmed">
                Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </Text>
            </Stack>
          )}
        </Group>

        <Divider />

        {/* Profile Form */}
        <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="First Name"
                placeholder="Enter your first name"
                leftSection={<IconUser size={16} />}
                disabled={!isEditingProfile}
                {...profileForm.getInputProps('firstName')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Last Name"
                placeholder="Enter your last name"
                leftSection={<IconUser size={16} />}
                disabled={!isEditingProfile}
                {...profileForm.getInputProps('lastName')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Email"
                placeholder="Enter your email"
                leftSection={<IconMail size={16} />}
                disabled={!isEditingProfile}
                {...profileForm.getInputProps('email')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Phone"
                placeholder="Enter your phone number"
                leftSection={<IconPhone size={16} />}
                disabled={!isEditingProfile}
                {...profileForm.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Bio"
                placeholder="Tell us about yourself"
                rows={4}
                disabled={!isEditingProfile}
                {...profileForm.getInputProps('bio')}
              />
            </Grid.Col>
          </Grid>
        </form>

        <Divider />

        {/* User Info */}
        <Stack gap="sm">
          <Group gap="md">
            <IconBuilding size={16} />
            <Text size="sm" fw={500}>
              Department:
            </Text>
            <Text size="sm">{user?.department?.name || 'Not assigned'}</Text>
          </Group>
          <Group gap="md">
            <IconCalendar size={16} />
            <Text size="sm" fw={500}>
              Joined:
            </Text>
            <Text size="sm">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </Group>
          <Group gap="md">
            <IconShield size={16} />
            <Text size="sm" fw={500}>
              Roles:
            </Text>
            <Group gap="xs">
              {user?.roles?.map(role => (
                <Badge key={role.id} variant="light" size="sm">
                  {role.name}
                </Badge>
              ))}
            </Group>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );

  const renderSecurityTab = () => (
    <Card padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Text size="lg" fw={600}>
          Security Settings
        </Text>
        {!isEditingSecurity ? (
          <Button
            leftSection={<IconEdit size={16} />}
            variant="light"
            onClick={() => setIsEditingSecurity(true)}
          >
            Change Password
          </Button>
        ) : (
          <Group gap="sm">
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={() => securityForm.onSubmit(handleSecuritySubmit)()}
            >
              Update Password
            </Button>
            <Button
              leftSection={<IconX size={16} />}
              variant="outline"
              onClick={() => {
                setIsEditingSecurity(false);
                securityForm.reset();
              }}
            >
              Cancel
            </Button>
          </Group>
        )}
      </Group>

      {isEditingSecurity ? (
        <form onSubmit={securityForm.onSubmit(handleSecuritySubmit)}>
          <Stack gap="md">
            <PasswordInput
              label="Current Password"
              placeholder="Enter your current password"
              required
              {...securityForm.getInputProps('currentPassword')}
            />
            <PasswordInput
              label="New Password"
              placeholder="Enter your new password"
              required
              {...securityForm.getInputProps('newPassword')}
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm your new password"
              required
              {...securityForm.getInputProps('confirmPassword')}
            />
          </Stack>
        </form>
      ) : (
        <Stack gap="md">
          <Alert color="blue" variant="light">
            <Text size="sm">
              Your password was last updated on{' '}
              {new Date().toLocaleDateString()}. For security reasons, we
              recommend changing your password regularly.
            </Text>
          </Alert>

          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Password Requirements:
            </Text>
            <Text size="xs" c="dimmed">
              • At least 8 characters long
            </Text>
            <Text size="xs" c="dimmed">
              • Contains uppercase and lowercase letters
            </Text>
            <Text size="xs" c="dimmed">
              • Contains at least one number
            </Text>
            <Text size="xs" c="dimmed">
              • Contains at least one special character
            </Text>
          </Stack>
        </Stack>
      )}
    </Card>
  );

  const renderPreferencesTab = () => (
    <Card padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="lg">
        <Text size="lg" fw={600}>
          Preferences
        </Text>
        <Button
          leftSection={<IconCheck size={16} />}
          onClick={() => preferencesForm.onSubmit(handlePreferencesSubmit)()}
        >
          Save Preferences
        </Button>
      </Group>

      <form onSubmit={preferencesForm.onSubmit(handlePreferencesSubmit)}>
        <Stack gap="lg">
          {/* Appearance */}
          <div>
            <Group gap="sm" mb="md">
              <IconPalette size={20} />
              <Text fw={500}>Appearance</Text>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Theme"
                  data={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'auto', label: 'Auto (System)' },
                  ]}
                  {...preferencesForm.getInputProps('theme')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Language"
                  leftSection={<IconLanguage size={16} />}
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                  ]}
                  {...preferencesForm.getInputProps('language')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Notifications */}
          <div>
            <Group gap="sm" mb="md">
              <IconBell size={20} />
              <Text fw={500}>Notifications</Text>
            </Group>
            <Stack gap="md">
              <Switch
                label="Email Notifications"
                description="Receive notifications via email"
                {...preferencesForm.getInputProps('emailNotifications', {
                  type: 'checkbox',
                })}
              />
              <Switch
                label="Push Notifications"
                description="Receive browser push notifications"
                {...preferencesForm.getInputProps('pushNotifications', {
                  type: 'checkbox',
                })}
              />
              <Switch
                label="Chat Notifications"
                description="Get notified about new chat messages"
                {...preferencesForm.getInputProps('chatNotifications', {
                  type: 'checkbox',
                })}
              />
            </Stack>
          </div>
        </Stack>
      </form>
    </Card>
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Text size="xl" fw={700} mb="xs">
            Profile Settings
          </Text>
          <Text c="dimmed">Manage your account settings and preferences.</Text>
        </div>

        {/* Tab Navigation */}
        <Group gap="md">
          <Button
            variant={activeTab === 'profile' ? 'filled' : 'light'}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </Button>
          <Button
            variant={activeTab === 'security' ? 'filled' : 'light'}
            onClick={() => setActiveTab('security')}
          >
            Security
          </Button>
          <Button
            variant={activeTab === 'preferences' ? 'filled' : 'light'}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </Button>
        </Group>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
      </Stack>
    </Container>
  );
};

export default ProfilePage;
