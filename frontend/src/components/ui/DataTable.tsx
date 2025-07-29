import React, { useState, useMemo } from 'react';
import {
  Table,
  Checkbox,
  Text,
  ActionIcon,
  Group,
  Pagination,
  TextInput,
  Select,
  Loader,
  Center,
  Stack,
  Paper,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';
import { DataTableProps, DataTableColumn } from '../../types';

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowSelection,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key];
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.key!];
      const bValue = b[sortState.key!];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortState]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortState(prev => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc')
          return { key: columnKey, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return;

    if (checked) {
      const allKeys = sortedData.map((_, index) => index);
      rowSelection.onChange(allKeys, sortedData);
    } else {
      rowSelection.onChange([], []);
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    if (!rowSelection) return;

    const newSelectedKeys = checked
      ? [...rowSelection.selectedRowKeys, index]
      : rowSelection.selectedRowKeys.filter(key => key !== index);

    const newSelectedRows = newSelectedKeys.map(
      key => sortedData[key as number]
    );
    rowSelection.onChange(newSelectedKeys, newSelectedRows);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortState.key !== columnKey) return null;
    return sortState.direction === 'asc' ? (
      <IconSortAscending size={14} />
    ) : (
      <IconSortDescending size={14} />
    );
  };

  const isAllSelected =
    rowSelection &&
    sortedData.length > 0 &&
    rowSelection.selectedRowKeys.length === sortedData.length;

  const isIndeterminate =
    rowSelection &&
    rowSelection.selectedRowKeys.length > 0 &&
    rowSelection.selectedRowKeys.length < sortedData.length;

  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Center h={200}>
          <Stack align="center" gap="sm">
            <Loader size="md" />
            <Text size="sm" c="dimmed">
              Loading data...
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper withBorder>
      <Stack gap="md" p="md">
        {/* Search and Controls */}
        <Group justify="space-between">
          <TextInput
            placeholder="Search..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={event => setSearchTerm(event.currentTarget.value)}
            style={{ flex: 1, maxWidth: 300 }}
          />

          {pagination && (
            <Select
              value={pageSize.toString()}
              onChange={value => {
                const newSize = parseInt(value || '10');
                setPageSize(newSize);
                pagination.onChange(1, newSize);
              }}
              data={[
                { value: '10', label: '10 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
              ]}
              w={150}
            />
          )}
        </Group>

        {/* Table */}
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {rowSelection && (
                  <Table.Th w={40}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={event =>
                        handleSelectAll(event.currentTarget.checked)
                      }
                      aria-label="Select all rows"
                    />
                  </Table.Th>
                )}
                {columns.map(column => (
                  <Table.Th
                    key={String(column.key)}
                    style={{
                      cursor: column.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={() => handleSort(String(column.key))}
                  >
                    <Group gap="xs" justify="space-between">
                      <Text fw={600}>{column.title}</Text>
                      {column.sortable && getSortIcon(String(column.key))}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (rowSelection ? 1 : 0)}>
                    <Center py="xl">
                      <Text c="dimmed">No data available</Text>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                sortedData.map((row, index) => (
                  <Table.Tr key={index}>
                    {rowSelection && (
                      <Table.Td>
                        <Checkbox
                          checked={rowSelection.selectedRowKeys.includes(index)}
                          onChange={event =>
                            handleSelectRow(index, event.currentTarget.checked)
                          }
                          aria-label={`Select row ${index + 1}`}
                        />
                      </Table.Td>
                    )}
                    {columns.map(column => (
                      <Table.Td key={String(column.key)}>
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]?.toString() || '-'}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(
                pagination.current * pagination.pageSize,
                pagination.total
              )}{' '}
              of {pagination.total} entries
            </Text>
            <Pagination
              value={pagination.current}
              onChange={page => pagination.onChange(page, pagination.pageSize)}
              total={Math.ceil(pagination.total / pagination.pageSize)}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
