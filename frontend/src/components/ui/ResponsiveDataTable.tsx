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
  Card,
  Badge,
  Button,
  Menu,
  Divider,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconDots,
  IconList,
  IconGrid3X3,
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { DataTableProps, DataTableColumn } from '../../types';
import { useResponsiveValue, useTouchGestures } from '../../utils/responsive';

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

type ViewMode = 'table' | 'cards';

export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowSelection,
  mobileCardRenderer,
}: DataTableProps<T> & {
  mobileCardRenderer?: (item: T, index: number) => React.ReactNode;
}) {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const isMobile = useMediaQuery('(max-width: 48em)');
  const isTablet = useMediaQuery('(max-width: 62em)');

  // Automatically switch to card view on mobile if no custom renderer provided
  const effectiveViewMode = isMobile && !mobileCardRenderer ? 'cards' : viewMode;

  // Responsive page size options
  const pageSizeOptions = useResponsiveValue({
    xs: [5, 10, 20],
    sm: [10, 25, 50],
    md: [10, 25, 50, 100],
    lg: [10, 25, 50, 100],
    xl: [10, 25, 50, 100],
  });

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

  // Default mobile card renderer
  const defaultMobileCardRenderer = (item: T, index: number) => {
    const touchGestures = useTouchGestures({
      onTap: () => {
        if (rowSelection) {
          const isSelected = rowSelection.selectedRowKeys.includes(index);
          handleSelectRow(index, !isSelected);
        }
      },
    });

    return (
      <Card
        key={index}
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          cursor: rowSelection ? 'pointer' : 'default',
          backgroundColor: rowSelection?.selectedRowKeys.includes(index)
            ? 'var(--mantine-color-blue-0)'
            : undefined,
        }}
        {...touchGestures}
      >
        <Stack gap="xs">
          {/* Header with selection checkbox */}
          {rowSelection && (
            <Group justify="space-between" align="center">
              <Checkbox
                checked={rowSelection.selectedRowKeys.includes(index)}
                onChange={event =>
                  handleSelectRow(index, event.currentTarget.checked)
                }
                size="sm"
              />
              <Text size="xs" c="dimmed">
                #{index + 1}
              </Text>
            </Group>
          )}

          {/* Main content */}
          <Stack gap="xs">
            {columns
              .filter(col => col.key !== 'actions')
              .slice(0, 4) // Show only first 4 columns on mobile
              .map(column => {
                const value = item[column.key];
                const displayValue = column.render
                  ? column.render(value, item)
                  : value?.toString() || '-';

                return (
                  <Group key={String(column.key)} justify="space-between">
                    <Text size="sm" fw={500} c="dimmed">
                      {column.title}:
                    </Text>
                    <Box style={{ textAlign: 'right', flex: 1 }}>
                      {typeof displayValue === 'string' ? (
                        <Text size="sm" truncate>
                          {displayValue}
                        </Text>
                      ) : (
                        displayValue
                      )}
                    </Box>
                  </Group>
                );
              })}
          </Stack>

          {/* Actions */}
          {columns.find(col => col.key === 'actions') && (
            <>
              <Divider />
              <Group justify="flex-end">
                {columns
                  .find(col => col.key === 'actions')
                  ?.render?.(null, item)}
              </Group>
            </>
          )}
        </Stack>
      </Card>
    );
  };

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
        <Group justify="space-between" wrap="wrap" gap="sm">
          <TextInput
            placeholder="Search..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={event => setSearchTerm(event.currentTarget.value)}
            style={{ flex: 1, minWidth: 200 }}
            size={isMobile ? 'md' : 'sm'}
          />

          <Group gap="sm" wrap="nowrap">
            {/* View mode toggle - only show on tablet and up */}
            {!isMobile && (
              <Group gap={0}>
                <ActionIcon
                  variant={effectiveViewMode === 'table' ? 'filled' : 'subtle'}
                  onClick={() => setViewMode('table')}
                  size="lg"
                >
                  <IconList size={16} />
                </ActionIcon>
                <ActionIcon
                  variant={effectiveViewMode === 'cards' ? 'filled' : 'subtle'}
                  onClick={() => setViewMode('cards')}
                  size="lg"
                >
                  <IconGrid3X3 size={16} />
                </ActionIcon>
              </Group>
            )}

            {pagination && (
              <Select
                value={pageSize.toString()}
                onChange={value => {
                  const newSize = parseInt(value || '10');
                  setPageSize(newSize);
                  pagination.onChange(1, newSize);
                }}
                data={pageSizeOptions.map(size => ({
                  value: size.toString(),
                  label: `${size} per page`,
                }))}
                w={isMobile ? 120 : 150}
                size={isMobile ? 'md' : 'sm'}
              />
            )}
          </Group>
        </Group>

        {/* Content */}
        {effectiveViewMode === 'table' ? (
          <ScrollArea>
            <Table
              striped
              highlightOnHover
              style={{ minWidth: isTablet ? 600 : 800 }}
            >
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
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Text fw={600} size={isTablet ? 'sm' : 'md'}>
                          {column.title}
                        </Text>
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
                            checked={rowSelection.selectedRowKeys.includes(
                              index
                            )}
                            onChange={event =>
                              handleSelectRow(
                                index,
                                event.currentTarget.checked
                              )
                            }
                            aria-label={`Select row ${index + 1}`}
                          />
                        </Table.Td>
                      )}
                      {columns.map(column => (
                        <Table.Td key={String(column.key)}>
                          <Box style={{ fontSize: isTablet ? '0.875rem' : '1rem' }}>
                            {column.render
                              ? column.render(row[column.key], row)
                              : row[column.key]?.toString() || '-'}
                          </Box>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <Stack gap="md">
            {sortedData.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">No data available</Text>
              </Center>
            ) : (
              sortedData.map((item, index) =>
                mobileCardRenderer
                  ? mobileCardRenderer(item, index)
                  : defaultMobileCardRenderer(item, index)
              )
            )}
          </Stack>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <Group justify="space-between" wrap="wrap" gap="sm">
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
              size={isMobile ? 'md' : 'sm'}
              siblings={isMobile ? 0 : 1}
              boundaries={isMobile ? 1 : 2}
            />
          </Group>
        )}
      </Stack>
    </Paper>
  );
}