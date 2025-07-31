import React from 'react';
import { Stack, Text, Card, Group, Button, Badge } from '@mantine/core';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface EmailTemplateListProps {
  templates: EmailTemplate[];
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (templateId: number) => void;
  onPreview?: (template: EmailTemplate) => void;
}

export const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
  templates,
  onEdit,
  onDelete,
  onPreview,
}) => {
  if (templates.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No email templates found. Create your first template to get started.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {templates.map((template) => (
        <Card key={template.id} shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="lg">
              {template.name}
            </Text>
            <Badge color={template.isActive ? 'green' : 'gray'} variant="light">
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed" mb="xs">
            Subject: {template.subject}
          </Text>

          <Text size="sm" mb="md">
            {template.description}
          </Text>

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Created: {new Date(template.createdAt).toLocaleDateString()}
            </Text>

            <Group gap="xs">
              {onPreview && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconEye size={14} />}
                  onClick={() => onPreview(template)}
                >
                  Preview
                </Button>
              )}
              {onEdit && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onEdit(template)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete(template.id)}
                >
                  Delete
                </Button>
              )}
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );
};

export default EmailTemplateList;