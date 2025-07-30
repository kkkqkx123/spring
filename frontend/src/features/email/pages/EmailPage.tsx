import React, { useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Button,
  Text,
  Card,
  Tabs,
  Modal,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconMail,
  IconTemplate,
  IconHistory,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { EmailComposer } from '../components/EmailComposer';
import { EmailTemplateList } from '../components/EmailTemplateList';
import { EmailHistory } from '../components/EmailHistory';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { useAuth } from '../../../hooks/useAuth';

const EmailPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('compose');
  const [
    composeModalOpened,
    { open: openComposeModal, close: closeComposeModal },
  ] = useDisclosure(false);

  // Permission checks
  const canSendEmail =
    user?.roles.some(role => ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role.name)) ??
    false;
  const canManageTemplates =
    user?.roles.some(role => ['ADMIN', 'HR_MANAGER'].includes(role.name)) ??
    false;

  const handleEmailSent = () => {
    notifications.show({
      title: 'Success',
      message: 'Email sent successfully',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
    closeComposeModal();
  };

  if (!canSendEmail) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Access Denied"
          color="red"
        >
          You don't have permission to access the email system.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Text size="xl" fw={700} mb="xs">
              Email Management
            </Text>
            <Text c="dimmed">
              Send emails and manage templates
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openComposeModal}
          >
            Compose Email
          </Button>
        </Group>

        {/* Tabs */}
        <Card padding="lg" radius="md" withBorder>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="compose" leftSection={<IconMail size={16} />}>
                Compose
              </Tabs.Tab>
              <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
                Templates
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                History
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="compose" pt="lg">
              <EmailComposer onEmailSent={handleEmailSent} />
            </Tabs.Panel>

            <Tabs.Panel value="templates" pt="lg">
              <EmailTemplateList canManage={canManageTemplates} />
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="lg">
              <EmailHistory />
            </Tabs.Panel>
          </Tabs>
        </Card>

        {/* Compose Modal */}
        <Modal
          opened={composeModalOpened}
          onClose={closeComposeModal}
          title="Compose Email"
          size="xl"
        >
          <EmailComposer 
            onEmailSent={handleEmailSent}
            onCancel={closeComposeModal}
          />
        </Modal>
      </Stack>
    </Container>
  );
};

export default EmailPage;