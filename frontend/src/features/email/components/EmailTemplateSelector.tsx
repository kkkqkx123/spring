import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  TextInput,
  Card,
  Text,
  Badge,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
  IconCheck,
  IconTemplate,
  IconInfoCircle,
  IconCalendar,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useEmailTemplates } from '../hooks/useEmail';
import type { EmailTemplate } from '../../../types';

interface EmailTemplateSelectorProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (template: EmailTemplate) => void;
  selectedTemplateId?: number;
}

export const EmailTemplateSelector: React.FC<EmailTemplateSelectorProps> = ({
  opened,
  onClose,
  onSelect,
  selectedTemplateId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // API hooks
  const { data: templates, isLoading } = useEmailTemplates();

  // Filter templates based on search
  const filteredTemplates =
    templates?.filter(
      template =>
        template.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        template.subject
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        template.description
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase())
    ) || [];

  const handleSelect = (template: EmailTemplate) => {
    onSelect(template);
    onClose();
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Main Template Selector Modal */}
      <Modal
        opened={opened && !previewTemplate}
        onClose={onClose}
        title="Select Email Template"
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          {/* Search */}
          <TextInput
            placeholder="Search templates by name, subject, or description..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={event => setSearchQuery(event.currentTarget.value)}
          />

          {/* Templates List */}
          {isLoading ? (
            <Text size="sm" c="dimmed">
              Loading templates...
            </Text>
          ) : filteredTemplates.length === 0 ? (
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              {templates?.length === 0
                ? 'No email templates available. Create your first template to get started.'
                : 'No templates found matching your search criteria.'}
            </Alert>
          ) : (
            <ScrollArea.Autosize mah={500}>
              <Stack gap="sm">
                {filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    withBorder
                    p="md"
                    style={{
                      cursor: 'pointer',
                      backgroundColor:
                        selectedTemplateId === template.id
                          ? 'var(--mantine-color-blue-0)'
                          : undefined,
                      borderColor:
                        selectedTemplateId === template.id
                          ? 'var(--mantine-color-blue-4)'
                          : undefined,
                    }}
                    onClick={() => handleSelect(template)}
                  >
                    <Stack gap="sm">
                      {/* Header */}
                      <Group justify="space-between">
                        <Group gap="sm">
                          <IconTemplate
                            size={20}
                            color="var(--mantine-color-blue-6)"
                          />
                          <div>
                            <Text size="sm" fw={600}>
                              {template.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Created {formatDate(template.createdAt)}
                            </Text>
                          </div>
                        </Group>
                        <Group gap="xs">
                          <Tooltip label="Preview template">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handlePreview(template);
                              }}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          {selectedTemplateId === template.id && (
                            <Badge color="blue" size="sm">
                              Selected
                            </Badge>
                          )}
                        </Group>
                      </Group>

                      {/* Subject */}
                      <div>
                        <Text size="xs" c="dimmed" mb={2}>
                          Subject:
                        </Text>
                        <Text size="sm" fw={500}>
                          {template.subject}
                        </Text>
                      </div>

                      {/* Description */}
                      {template.description && (
                        <div>
                          <Text size="xs" c="dimmed" mb={2}>
                            Description:
                          </Text>
                          <Text size="sm">{template.description}</Text>
                        </div>
                      )}

                      {/* Variables */}
                      {template.variables.length > 0 && (
                        <div>
                          <Text size="xs" c="dimmed" mb={4}>
                            Variables:
                          </Text>
                          <Group gap="xs">
                            {template.variables.map(variable => (
                              <Badge key={variable} variant="light" size="xs">
                                {variable}
                              </Badge>
                            ))}
                          </Group>
                        </div>
                      )}

                      {/* Content Preview */}
                      <div>
                        <Text size="xs" c="dimmed" mb={2}>
                          Content Preview:
                        </Text>
                        <Text
                          size="xs"
                          c="dimmed"
                          lineClamp={2}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {template.content}
                        </Text>
                      </div>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Template Preview Modal */}
      <Modal
        opened={!!previewTemplate}
        onClose={closePreview}
        title={`Preview: ${previewTemplate?.name}`}
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {previewTemplate && (
          <Stack gap="md">
            {/* Template Info */}
            <Card withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    {previewTemplate.name}
                  </Text>
                  <Badge variant="light">
                    {previewTemplate.variables.length} variables
                  </Badge>
                </Group>

                {previewTemplate.description && (
                  <Text size="sm" c="dimmed">
                    {previewTemplate.description}
                  </Text>
                )}

                <Group gap="xs">
                  <IconCalendar size={14} />
                  <Text size="xs" c="dimmed">
                    Created {formatDate(previewTemplate.createdAt)}
                  </Text>
                </Group>
              </Stack>
            </Card>

            {/* Variables */}
            {previewTemplate.variables.length > 0 && (
              <Card withBorder>
                <Stack gap="sm">
                  <Text size="sm" fw={500}>
                    Required Variables
                  </Text>
                  <Group gap="xs">
                    {previewTemplate.variables.map(variable => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </Group>
                  <Text size="xs" c="dimmed">
                    These variables will need to be filled when composing the
                    email.
                  </Text>
                </Stack>
              </Card>
            )}

            {/* Subject */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                Subject
              </Text>
              <Card withBorder p="sm">
                <Text size="sm">{previewTemplate.subject}</Text>
              </Card>
            </div>

            {/* Content */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                Content
              </Text>
              <Card withBorder p="sm">
                <ScrollArea.Autosize mah={300}>
                  <Text
                    size="sm"
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    {previewTemplate.content}
                  </Text>
                </ScrollArea.Autosize>
              </Card>
            </div>

            {/* Actions */}
            <Group justify="space-between">
              <Button variant="light" onClick={closePreview}>
                Back to Templates
              </Button>
              <Button
                leftSection={<IconCheck size={16} />}
                onClick={() => {
                  handleSelect(previewTemplate);
                  closePreview();
                }}
              >
                Use This Template
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
};
