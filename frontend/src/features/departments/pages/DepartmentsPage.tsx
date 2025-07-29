import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Modal,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconRefresh, IconBuilding } from '@tabler/icons-react';
import { DepartmentTree } from '../components/DepartmentTree';
import { DepartmentDetail } from '../components/DepartmentDetail';
import { DepartmentForm } from '../components/DepartmentForm';
import { DepartmentMoveDialog } from '../components/DepartmentMoveDialog';
import { Department } from '../../../types';

export const DepartmentsPage: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<number | undefined>();
  const [departmentToMove, setDepartmentToMove] = useState<Department | null>(
    null
  );

  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);
  const [moveDialogOpened, { open: openMoveDialog, close: closeMoveDialog }] =
    useDisclosure(false);

  const handleSelectDepartment = (department: Department) => {
    setSelectedDepartment(department);
  };

  const handleCreateDepartment = (parentId?: number) => {
    setParentIdForNew(parentId);
    openCreateModal();
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    // The DepartmentDetail component will handle the edit modal
  };

  const handleMoveDepartment = (department: Department) => {
    setDepartmentToMove(department);
    openMoveDialog();
  };

  const handleCreateSuccess = () => {
    closeCreateModal();
    setParentIdForNew(undefined);
  };

  const handleCreateCancel = () => {
    closeCreateModal();
    setParentIdForNew(undefined);
  };

  const handleMoveSuccess = () => {
    closeMoveDialog();
    setDepartmentToMove(null);
  };

  const handleMoveCancel = () => {
    closeMoveDialog();
    setDepartmentToMove(null);
  };

  const handleDeleteDepartment = () => {
    // Clear selection if the deleted department was selected
    setSelectedDepartment(null);
  };

  const refreshData = () => {
    // This would typically trigger a refetch of the department tree
    window.location.reload();
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <IconBuilding size={32} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xl" fw={700}>
                Department Management
              </Text>
              <Text size="sm" c="dimmed">
                Manage your organization's department structure
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Tooltip label="Refresh">
              <ActionIcon variant="light" onClick={refreshData}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleCreateDepartment()}
            >
              Add Department
            </Button>
          </Group>
        </Group>

        {/* Main Content */}
        <Grid>
          {/* Department Tree */}
          <Grid.Col span={{ base: 12, md: selectedDepartment ? 6 : 12 }}>
            <Paper
              withBorder
              p="md"
              h="calc(100vh - 200px)"
              style={{ overflow: 'auto' }}
            >
              <DepartmentTree
                onSelectDepartment={handleSelectDepartment}
                onEditDepartment={handleEditDepartment}
                onCreateDepartment={handleCreateDepartment}
                selectedDepartmentId={selectedDepartment?.id}
                allowDragDrop={true}
                showEmployeeCount={true}
              />
            </Paper>
          </Grid.Col>

          {/* Department Detail */}
          {selectedDepartment && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper
                withBorder
                p="md"
                h="calc(100vh - 200px)"
                style={{ overflow: 'auto' }}
              >
                <DepartmentDetail
                  departmentId={selectedDepartment.id}
                  onCreateChild={() =>
                    handleCreateDepartment(selectedDepartment.id)
                  }
                  onDelete={handleDeleteDepartment}
                  onClose={() => setSelectedDepartment(null)}
                />
              </Paper>
            </Grid.Col>
          )}
        </Grid>
      </Stack>

      {/* Create Department Modal */}
      <Modal
        opened={createModalOpened}
        onClose={handleCreateCancel}
        title={parentIdForNew ? 'Add Subdepartment' : 'Add Department'}
        size="md"
      >
        <DepartmentForm
          parentId={parentIdForNew}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </Modal>

      {/* Move Department Dialog */}
      {departmentToMove && (
        <DepartmentMoveDialog
          opened={moveDialogOpened}
          onClose={handleMoveCancel}
          department={departmentToMove}
          onSuccess={handleMoveSuccess}
        />
      )}
    </Container>
  );
};
