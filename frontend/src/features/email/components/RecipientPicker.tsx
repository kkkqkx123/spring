import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  TextInput,
  Tabs,
  Card,
  Text,
  Badge,
  Checkbox,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconSearch,
  IconUser,
  IconBuilding,
  IconUsers,
  IconCheck,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useEmailRecipients, useDepartmentRecipients } from '../hooks/useEmail';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { useEmployees } from '../../employees/hooks/useEmployees';
import type { EmailRecipient, Department, Employee } from '../../../types';

interface RecipientPickerProps {
  opened: boolean;
  onClose: () => void;
  selectedRecipients: EmailRecipient[];
  onRecipientsChange: (recipients: EmailRecipient[]) => void;
}

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
  opened,
  onClose,
  selectedRecipients,
  onRecipientsChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>('individuals');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    null
  );

  // API hooks
  const { data: allRecipients, isLoading: recipientsLoading } =
    useEmailRecipients();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: employees, isLoading: employeesLoading } = useEmployees({
    page: 0,
    size: 100,
  });
  const { data: departmentEmployees } = useDepartmentRecipients(
    selectedDepartment || 0
  );

  // Filter recipients based on search and tab
  const filteredIndividuals =
    allRecipients?.filter(
      recipient =>
        recipient.type === 'individual' &&
        (recipient.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          recipient.email.toLowerCase().includes(debouncedSearch.toLowerCase()))
    ) || [];

  const filteredDepartments =
    allRecipients?.filter(
      recipient =>
        recipient.type === 'department' &&
        recipient.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) || [];

  // Check if recipient is selected
  const isRecipientSelected = (recipient: EmailRecipient) => {
    return selectedRecipients.some(selected => selected.id === recipient.id);
  };

  // Toggle recipient selection
  const toggleRecipient = (recipient: EmailRecipient) => {
    if (isRecipientSelected(recipient)) {
      onRecipientsChange(
        selectedRecipients.filter(selected => selected.id !== recipient.id)
      );
    } else {
      onRecipientsChange([...selectedRecipients, recipient]);
    }
  };

  // Select all in current view
  const selectAllVisible = () => {
    const visibleRecipients =
      activeTab === 'individuals' ? filteredIndividuals : filteredDepartments;

    const newRecipients = [...selectedRecipients];
    visibleRecipients.forEach(recipient => {
      if (!isRecipientSelected(recipient)) {
        newRecipients.push(recipient);
      }
    });

    onRecipientsChange(newRecipients);
  };

  // Clear all selections
  const clearAll = () => {
    onRecipientsChange([]);
  };

  // Select entire department
  const selectDepartment = (department: Department) => {
    const departmentRecipient: EmailRecipient = {
      id: department.id,
      name: department.name,
      email: `department-${department.id}@company.com`, // Placeholder
      type: 'department',
    };

    toggleRecipient(departmentRecipient);
  };

  const handleSave = () => {
    onClose();
  };

  const isLoading = recipientsLoading || departmentsLoading || employeesLoading;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Select Recipients"
      size="lg"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {/* Search */}
        <TextInput
          placeholder="Search recipients..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={event => setSearchQuery(event.currentTarget.value)}
        />

        {/* Selection Summary */}
        <Card withBorder>
          <Group justify="space-between">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                Selected: {selectedRecipients.length} recipient(s)
              </Text>
              {selectedRecipients.length > 0 && (
                <Badge variant="light" size="sm">
                  {
                    selectedRecipients.filter(r => r.type === 'individual')
                      .length
                  }{' '}
                  individuals,{' '}
                  {
                    selectedRecipients.filter(r => r.type === 'department')
                      .length
                  }{' '}
                  departments
                </Badge>
              )}
            </Group>
            <Group gap="xs">
              <Button size="xs" variant="light" onClick={selectAllVisible}>
                Select All Visible
              </Button>
              <Button size="xs" variant="light" color="red" onClick={clearAll}>
                Clear All
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="individuals" leftSection={<IconUser size={16} />}>
              Individuals ({filteredIndividuals.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="departments"
              leftSection={<IconBuilding size={16} />}
            >
              Departments ({filteredDepartments.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Individuals Tab */}
          <Tabs.Panel value="individuals" pt="md">
            <Stack gap="xs">
              {isLoading ? (
                <Text size="sm" c="dimmed">
                  Loading individuals...
                </Text>
              ) : filteredIndividuals.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                  No individuals found matching your search.
                </Alert>
              ) : (
                <ScrollArea.Autosize mah={400}>
                  <Stack gap="xs">
                    {filteredIndividuals.map(recipient => (
                      <Card
                        key={recipient.id}
                        withBorder
                        p="sm"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isRecipientSelected(recipient)
                            ? 'var(--mantine-color-blue-0)'
                            : undefined,
                        }}
                        onClick={() => toggleRecipient(recipient)}
                      >
                        <Group justify="space-between">
                          <Group gap="sm">
                            <Checkbox
                              checked={isRecipientSelected(recipient)}
                              onChange={() => toggleRecipient(recipient)}
                              onClick={e => e.stopPropagation()}
                            />
                            <div>
                              <Text size="sm" fw={500}>
                                {recipient.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {recipient.email}
                              </Text>
                            </div>
                          </Group>
                          <IconUser
                            size={16}
                            color="var(--mantine-color-blue-6)"
                          />
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Departments Tab */}
          <Tabs.Panel value="departments" pt="md">
            <Stack gap="xs">
              {isLoading ? (
                <Text size="sm" c="dimmed">
                  Loading departments...
                </Text>
              ) : filteredDepartments.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                  No departments found matching your search.
                </Alert>
              ) : (
                <ScrollArea.Autosize mah={400}>
                  <Stack gap="xs">
                    {filteredDepartments.map(recipient => (
                      <Card
                        key={recipient.id}
                        withBorder
                        p="sm"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isRecipientSelected(recipient)
                            ? 'var(--mantine-color-blue-0)'
                            : undefined,
                        }}
                        onClick={() => toggleRecipient(recipient)}
                      >
                        <Group justify="space-between">
                          <Group gap="sm">
                            <Checkbox
                              checked={isRecipientSelected(recipient)}
                              onChange={() => toggleRecipient(recipient)}
                              onClick={e => e.stopPropagation()}
                            />
                            <div>
                              <Text size="sm" fw={500}>
                                {recipient.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Department • All employees will receive the
                                email
                              </Text>
                            </div>
                          </Group>
                          <Group gap="xs">
                            <Tooltip label="View department employees">
                              <ActionIcon
                                variant="light"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDepartment(recipient.id);
                                }}
                              >
                                <IconUsers size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <IconBuilding
                              size={16}
                              color="var(--mantine-color-green-6)"
                            />
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Department Employees Preview */}
        {selectedDepartment && departmentEmployees && (
          <Card withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Department Employees ({departmentEmployees.length})
                </Text>
                <ActionIcon
                  variant="light"
                  size="sm"
                  onClick={() => setSelectedDepartment(null)}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
              <ScrollArea.Autosize mah={200}>
                <Stack gap="xs">
                  {departmentEmployees.map(employee => (
                    <Group key={employee.id} gap="sm">
                      <IconUser size={14} />
                      <div>
                        <Text size="xs">{employee.name}</Text>
                        <Text size="xs" c="dimmed">
                          {employee.email}
                        </Text>
                      </div>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Stack>
          </Card>
        )}

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button leftSection={<IconCheck size={16} />} onClick={handleSave}>
            Save Selection
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
