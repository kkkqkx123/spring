import React, { useState, useCallback } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Menu,
  Collapse,
  Paper,
  Stack,
  Badge,
  Tooltip,
  Alert,
  Center,
  Loader,
} from '@mantine/core';
import {
  IconChevronRight,
  IconChevronDown,
  IconDots,
  IconEdit,
  IconTrash,
  IconPlus,
  IconUsers,
  IconBuilding,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useDragAndDrop } from '@mantine/dnd';
import { notifications } from '@mantine/notifications';
import { useDepartmentTree, useDeleteDepartment, useMoveDepartment } from '../hooks/useDepartmentTree';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Department } from '../../../types';

interface DepartmentTreeProps {
  onSelectDepartment?: (department: Department) => void;
  onEditDepartment?: (department: Department) => void;
  onCreateDepartment?: (parentId?: number) => void;
  selectedDepartmentId?: number;
  allowDragDrop?: boolean;
  showEmployeeCount?: boolean;
  compact?: boolean;
}

interface DepartmentNodeProps {
  department: Department;
  level: number;
  onSelectDepartment?: (department: Department) => void;
  onEditDepartment?: (department: Department) => void;
  onCreateDepartment?: (parentId?: number) => void;
  onDeleteDepartment: (id: number) => void;
  onMoveDepartment: (departmentId: number, newParentId?: number) => void;
  selectedDepartmentId?: number;
  allowDragDrop?: boolean;
  showEmployeeCount?: boolean;
  compact?: boolean;
  expandedNodes: Set<number>;
  onToggleExpand: (id: number) => void;
}

const DepartmentNode: React.FC<DepartmentNodeProps> = ({
  department,
  level,
  onSelectDepartment,
  onEditDepartment,
  onCreateDepartment,
  onDeleteDepartment,
  onMoveDepartment,
  selectedDepartmentId,
  allowDragDrop = false,
  showEmployeeCount = true,
  compact = false,
  expandedNodes,
  onToggleExpand,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasChildren = department.children && department.children.length > 0;
  const isExpanded = expandedNodes.has(department.id);
  const isSelected = selectedDepartmentId === department.id;

  const handleToggleExpand = useCallback(() => {
    if (hasChildren) {
      onToggleExpand(department.id);
    }
  }, [hasChildren, department.id, onToggleExpand]);

  const handleSelect = useCallback(() => {
    onSelectDepartment?.(department);
  }, [department, onSelectDepartment]);

  const handleEdit = useCallback(() => {
    onEditDepartment?.(department);
  }, [department, onEditDepartment]);

  const handleCreateChild = useCallback(() => {
    onCreateDepartment?.(department.id);
  }, [department.id, onCreateDepartment]);

  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDeleteDepartment(department.id);
    setDeleteDialogOpen(false);
  }, [department.id, onDeleteDepartment]);

  const nodeContent = (
    <Paper
      p={compact ? 'xs' : 'sm'}
      withBorder
      bg={isSelected ? 'blue.0' : undefined}
      style={{
        marginLeft: level * (compact ? 16 : 24),
        cursor: 'pointer',
        borderColor: isSelected ? 'var(--mantine-color-blue-4)' : undefined,
      }}
      onClick={handleSelect}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            size={compact ? 'sm' : 'md'}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            style={{
              visibility: hasChildren ? 'visible' : 'hidden',
            }}
          >
            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </ActionIcon>

          <IconBuilding size={compact ? 16 : 20} color="var(--mantine-color-blue-6)" />

          <Box>
            <Text size={compact ? 'sm' : 'md'} fw={500}>
              {department.name}
            </Text>
            {!compact && department.description && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {department.description}
              </Text>
            )}
          </Box>

          {showEmployeeCount && (
            <Badge
              size={compact ? 'xs' : 'sm'}
              variant="light"
              leftSection={<IconUsers size={12} />}
            >
              {department.employeeCount}
            </Badge>
          )}
        </Group>

        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              size={compact ? 'sm' : 'md'}
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={handleEdit}>
              Edit Department
            </Menu.Item>
            <Menu.Item leftSection={<IconPlus size={16} />} onClick={handleCreateChild}>
              Add Subdepartment
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={handleDelete}
              disabled={department.employeeCount > 0 || hasChildren}
            >
              Delete Department
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );

  return (
    <>
      {allowDragDrop ? (
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', department.id.toString());
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
            if (draggedId !== department.id) {
              onMoveDepartment(draggedId, department.id);
            }
          }}
        >
          {nodeContent}
        </div>
      ) : (
        nodeContent
      )}

      <Collapse in={isExpanded}>
        {hasChildren && (
          <Stack gap={compact ? 'xs' : 'sm'} mt={compact ? 'xs' : 'sm'}>
            {department.children!.map((child) => (
              <DepartmentNode
                key={child.id}
                department={child}
                level={level + 1}
                onSelectDepartment={onSelectDepartment}
                onEditDepartment={onEditDepartment}
                onCreateDepartment={onCreateDepartment}
                onDeleteDepartment={onDeleteDepartment}
                onMoveDepartment={onMoveDepartment}
                selectedDepartmentId={selectedDepartmentId}
                allowDragDrop={allowDragDrop}
                showEmployeeCount={showEmployeeCount}
                compact={compact}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </Stack>
        )}
      </Collapse>

      <ConfirmDialog
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${department.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="red"
      />
    </>
  );
};

export const DepartmentTree: React.FC<DepartmentTreeProps> = ({
  onSelectDepartment,
  onEditDepartment,
  onCreateDepartment,
  selectedDepartmentId,
  allowDragDrop = false,
  showEmployeeCount = true,
  compact = false,
}) => {
  const { data: departments, isLoading, error } = useDepartmentTree();
  const deleteDepart = useDeleteDepartment();
  const moveDepart = useMoveDepartment();
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleDeleteDepartment = useCallback(
    (id: number) => {
      deleteDepart.mutate(id);
    },
    [deleteDepart]
  );

  const handleMoveDepartment = useCallback(
    (departmentId: number, newParentId?: number) => {
      moveDepart.mutate({ departmentId, newParentId });
    },
    [moveDepart]
  );

  const expandAll = useCallback(() => {
    const getAllIds = (depts: Department[]): number[] => {
      const ids: number[] = [];
      depts.forEach((dept) => {
        ids.push(dept.id);
        if (dept.children) {
          ids.push(...getAllIds(dept.children));
        }
      });
      return ids;
    };

    if (departments) {
      setExpandedNodes(new Set(getAllIds(departments)));
    }
  }, [departments]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  if (isLoading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
        Failed to load department tree. Please try again.
      </Alert>
    );
  }

  if (!departments || departments.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Stack align="center" gap="md">
            <IconBuilding size={48} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed">No departments found</Text>
            {onCreateDepartment && (
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => onCreateDepartment()}
              >
                <IconPlus size={20} />
              </ActionIcon>
            )}
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Box>
      {!compact && (
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={600}>
            Department Structure
          </Text>
          <Group gap="xs">
            <Tooltip label="Expand All">
              <ActionIcon variant="subtle" onClick={expandAll}>
                <IconChevronDown size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Collapse All">
              <ActionIcon variant="subtle" onClick={collapseAll}>
                <IconChevronRight size={16} />
              </ActionIcon>
            </Tooltip>
            {onCreateDepartment && (
              <Tooltip label="Add Department">
                <ActionIcon variant="light" onClick={() => onCreateDepartment()}>
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      )}

      <Stack gap={compact ? 'xs' : 'sm'}>
        {departments.map((department) => (
          <DepartmentNode
            key={department.id}
            department={department}
            level={0}
            onSelectDepartment={onSelectDepartment}
            onEditDepartment={onEditDepartment}
            onCreateDepartment={onCreateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onMoveDepartment={handleMoveDepartment}
            selectedDepartmentId={selectedDepartmentId}
            allowDragDrop={allowDragDrop}
            showEmployeeCount={showEmployeeCount}
            compact={compact}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </Stack>
    </Box>
  );
};