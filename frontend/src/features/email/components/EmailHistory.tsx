import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Modal,
  Text,
  Card,
  ScrollArea,
  Pagination,
  Select,
} from '@mantine/core';
import {
  IconSearch,
  IconEye,
  IconRefresh,
  IconMail,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { useEmailHistory, useEmailDetails } from '../hooks/useEmail';
import type { EmailHistory as EmailHistoryType, EmailStatus } from '../../../types';

interface EmailHistoryProps {
  onResend?: (emailId: number) => void;
}

export const EmailHistory: React.FC<EmailHistoryProps> = ({ onResend }) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | ''>('');
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // API hooks
  const { data: emailHistory, isLoading, refetch } = useEmailHistory({
    page,
    size: pageSize,
    sort: 'sentAt,desc',
  });

  const { data: emailDetails, isLoading: detailsLoading } = useEmailDetails(
    selectedEmailId || 0
  );

  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case 'SENT':
        return 'green';
      case 'PENDING':
        return 'blue';
      case 'SENDING':
        return 'orange';
      case 'FAILED':
        return 'red';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case 'SENT':
        return <IconCheck size={14} />;
      case 'PENDING':
        return <IconClock size={14} />;
      case 'SENDING':
        return <IconMail size={14} />;
      case 'FAILED':
        return <IconX size={14} />;
      case 'CANCELLED':
        return <IconAlertCircle size={14} />;
      default:
        return <IconClock size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (emailId: number) => {
    setSelectedEmailId(emailId);
  };

  const closeDetails = () => {
    setSelectedEmailId(null);
  };

  const filteredEmails = emailHistory?.content.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                         email.templateName?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesStatus = statusFilter === '' || email.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <>
      <Paper p="md" withBorder>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Text size="lg" fw={600}>Email History</Text>
            <Group gap="sm">
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => refetch()}
                loading={isLoading}
              >
                Refresh
              </Button>
            </Group>
          </Group>

          {/* Filters */}
          <Group gap="md">
            <TextInput
              placeholder="Search by subject or template..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: '', label: 'All Statuses' },
                { value: 'SENT', label: 'Sent' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'SENDING', label: 'Sending' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as EmailStatus | '')}
              clearable
            />
            <Select
              placeholder="Page size"
              data={[
                { value: '10', label: '10 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
              ]}
              value={pageSize.toString()}
              onChange={(value) => {
                setPageSize(parseInt(value || '10'));
                setPage(0);
              }}
            />
          </Group>

          {/* Email History Table */}
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Subject</Table.Th>
                  <Table.Th>Template</Table.Th>
                  <Table.Th>Recipients</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Sent At</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed">Loading...</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredEmails.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed">No emails found</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredEmails.map((email) => (
                    <Table.Tr key={email.id}>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {email.subject}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {email.templateName || 'Custom'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {email.recipientCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(email.status)}
                          leftSection={getStatusIcon(email.status)}
                          size="sm"
                        >
                          {email.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDate(email.sentAt)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="View details">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => handleViewDetails(email.id)}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          {email.status === 'FAILED' && onResend && (
                            <Tooltip label="Resend email">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={() => onResend(email.id)}
                              >
                                <IconMail size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          {emailHistory && emailHistory.totalPages > 1 && (
            <Group justify="center">
              <Pagination
                value={page + 1}
                onChange={(value) => setPage(value - 1)}
                total={emailHistory.totalPages}
                size="sm"
              />
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Email Details Modal */}
      <Modal
        opened={!!selectedEmailId}
        onClose={closeDetails}
        title="Email Details"
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {emailDetails && (
          <Stack gap="md">
            {/* Email Info */}
            <Card withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>{emailDetails.subject}</Text>
                  <Badge
                    color={getStatusColor(emailDetails.status)}
                    leftSection={getStatusIcon(emailDetails.status)}
                  >
                    {emailDetails.status}
                  </Badge>
                </Group>
                
                <Group gap="md">
                  <div>
                    <Text size="xs" c="dimmed">Template</Text>
                    <Text size="sm">{emailDetails.templateName || 'Custom'}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Recipients</Text>
                    <Text size="sm">{emailDetails.recipientCount}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Sent At</Text>
                    <Text size="sm">{formatDate(emailDetails.sentAt)}</Text>
                  </div>
                </Group>

                {emailDetails.errorMessage && (
                  <Text size="sm" c="red">
                    Error: {emailDetails.errorMessage}
                  </Text>
                )}
              </Stack>
            </Card>

            {/* Recipients */}
            <Card withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500}>Recipients ({emailDetails.recipients.length})</Text>
                <ScrollArea.Autosize mah={200}>
                  <Stack gap="xs">
                    {emailDetails.recipients.map((recipient) => (
                      <Group key={recipient.id} gap="sm">
                        {recipient.type === 'department' ? (
                          <IconBuilding size={16} />
                        ) : (
                          <IconMail size={16} />
                        )}
                        <div>
                          <Text size="sm">{recipient.name}</Text>
                          <Text size="xs" c="dimmed">{recipient.email}</Text>
                        </div>
                      </Group>
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              </Stack>
            </Card>

            {/* Content */}
            <Card withBorder>
              <Stack gap="sm">
                <Text size="sm" fw={500}>Email Content</Text>
                <ScrollArea.Autosize mah={300}>
                  <Text 
                    size="sm" 
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    {emailDetails.content}
                  </Text>
                </ScrollArea.Autosize>
              </Stack>
            </Card>

            {/* Actions */}
            <Group justify="flex-end">
              <Button variant="light" onClick={closeDetails}>
                Close
              </Button>
              {emailDetails.status === 'FAILED' && onResend && (
                <Button
                  leftSection={<IconMail size={16} />}
                  onClick={() => {
                    onResend(emailDetails.id);
                    closeDetails();
                  }}
                >
                  Resend Email
                </Button>
              )}
            </Group>
          </Stack>
        )}
        
        {detailsLoading && (
          <Text ta="center" c="dimmed">Loading email details...</Text>
        )}
      </Modal>
    </>
  );
};