import React, { useState, useMemo, memo, useCallback } from 'react';
import {
  Table,
  Checkbox,
  Text,
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
import type { DataTableProps, DataTableColumn } from '../../types';
import {
  useDeepMemo,
  useDebouncedValue,
  useThrottledCallback,
} from '../../utils/memoization';

interface SortState {
  key: string | null;
  direction: 'asc' | 'desc' | null;
}

// Memoized table header component
function TableHeaderComponent<T extends Record<string, unknown>>({
  columns,
  sortState,
  onSort,
  hasRowSelection,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
}: {
  columns: DataTableColumn<T>[];
  sortState: SortState;
  onSort: (key: string) => void;
  hasRowSelection: boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
}) {
  const getSortIcon = useCallback(
    (columnKey: string) => {
      if (sortState.key !== columnKey) return null;
      return sortState.direction === 'asc' ? (
        <IconSortAscending size={14} />
      ) : (
        <IconSortDescending size={14} />
      );
    },
    [sortState]
  );

  return (
    <Table.Thead>
      <Table.Tr>
        {hasRowSelection && (
          <Table.Th w={40}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={event => onSelectAll(event.currentTarget.checked)}
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
            onClick={() => column.sortable && onSort(String(column.key))}
          >
            <Group gap="xs" justify="space-between">
              <Text fw={600}>{column.title}</Text>
              {column.sortable && getSortIcon(String(column.key))}
            </Group>
          </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  );
}
const TableHeader = memo(TableHeaderComponent) as <
  T extends Record<string, unknown>,
>(
  props: React.ComponentProps<typeof TableHeaderComponent<T>>
) => React.ReactElement;

// Memoized table row component
function TableRowComponent<T extends Record<string, unknown>>({
  row,
  index,
  columns,
  hasRowSelection,
  isSelected,
  onSelectRow,
}: {
  row: T;
  index: number;
  columns: DataTableColumn<T>[];
  hasRowSelection: boolean;
  isSelected: boolean;
  onSelectRow: (index: number, checked: boolean) => void;
}) {
  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSelectRow(index, event.currentTarget.checked);
    },
    [index, onSelectRow]
  );

  return (
    <Table.Tr key={index}>
      {hasRowSelection && (
        <Table.Td>
          <Checkbox
            checked={isSelected}
            onChange={handleSelectChange}
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
  );
}
const TableRow = memo(TableRowComponent) as <T extends Record<string, unknown>>(
  props: React.ComponentProps<typeof TableRowComponent<T>>
) => React.ReactElement;
// Memoized search controls component
const SearchControls = memo<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasPagination: boolean;
}>(
  ({
    searchTerm,
    onSearchChange,
    pageSize,
    onPageSizeChange,
    hasPagination,
  }) => {
    const handleSearchChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.currentTarget.value);
      },
      [onSearchChange]
    );

    const handlePageSizeChange = useCallback(
      (value: string | null) => {
        const newSize = parseInt(value || '10');
        onPageSizeChange(newSize);
      },
      [onPageSizeChange]
    );

    return (
      <Group justify="space-between">
        <TextInput
          placeholder="Search..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ flex: 1, maxWidth: 300 }}
        />

        {hasPagination && (
          <Select
            value={pageSize.toString()}
            onChange={handlePageSizeChange}
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
    );
  }
);

SearchControls.displayName = 'SearchControls';

export function OptimizedDataTable<T extends Record<string, unknown>>({
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

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Memoized filtered data with deep comparison
  const filteredData = useDeepMemo(() => {
    if (!debouncedSearchTerm) return data;

    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key];
        return value
          ?.toString()
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      })
    );
  }, [data, debouncedSearchTerm, columns]);

  // Memoized sorted data
  const sortedData = useDeepMemo(() => {
    if (!sortState.key || !sortState.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.key!] as unknown;
      const bValue = b[sortState.key!] as unknown;

      if (aValue === bValue) return 0;

      // Handle different types for comparison
      const comparison = (() => {
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return aValue - bValue;
        }
        // Fallback to string comparison
        return String(aValue).localeCompare(String(bValue));
      })();

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortState]);

  // Throttled sort handler to prevent excessive sorting
  const handleSort = useThrottledCallback((columnKey: string | number) => {
    // Convert columnKey to string for consistent comparison
    const columnKeyString = String(columnKey);
    const column = columns.find(col => String(col.key) === columnKeyString);
    if (!column?.sortable) return;

    setSortState(prev => {
      if (prev.key === columnKeyString) {
        if (prev.direction === 'asc') {
          return { key: columnKeyString, direction: 'desc' };
        }
        if (prev.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      return { key: columnKeyString, direction: 'asc' };
    });
  }, 100);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!rowSelection) return;

      if (checked) {
        const allKeys = sortedData.map((_, index) => index);
        rowSelection.onChange(allKeys, sortedData);
      } else {
        rowSelection.onChange([], []);
      }
    },
    [rowSelection, sortedData]
  );

  const handleSelectRow = useCallback(
    (index: number, checked: boolean) => {
      if (!rowSelection) return;

      const newSelectedKeys = checked
        ? [...rowSelection.selectedRowKeys, index]
        : rowSelection.selectedRowKeys.filter(key => key !== index);

      const newSelectedRows = newSelectedKeys.map(
        key => sortedData[key as number]
      );
      rowSelection.onChange(newSelectedKeys, newSelectedRows);
    },
    [rowSelection, sortedData]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      pagination?.onChange(1, newSize);
    },
    [pagination]
  );

  // Memoized selection state
  const selectionState = useMemo(() => {
    if (!rowSelection) return { isAllSelected: false, isIndeterminate: false };

    const isAllSelected =
      sortedData.length > 0 &&
      rowSelection.selectedRowKeys.length === sortedData.length;
    const isIndeterminate =
      rowSelection.selectedRowKeys.length > 0 &&
      rowSelection.selectedRowKeys.length < sortedData.length;

    return { isAllSelected, isIndeterminate };
  }, [rowSelection, sortedData]);

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
        <SearchControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          hasPagination={!!pagination}
        />

        {/* Table */}
        <ScrollArea>
          <Table striped highlightOnHover>
            <TableHeader
              columns={columns}
              sortState={sortState}
              onSort={handleSort}
              hasRowSelection={!!rowSelection}
              isAllSelected={selectionState.isAllSelected}
              isIndeterminate={selectionState.isIndeterminate}
              onSelectAll={handleSelectAll}
            />
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
                  <TableRow
                    key={`${row.id || index}`}
                    row={row}
                    index={index}
                    columns={columns}
                    hasRowSelection={!!rowSelection}
                    isSelected={
                      rowSelection?.selectedRowKeys.includes(index) || false
                    }
                    onSelectRow={handleSelectRow}
                  />
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
