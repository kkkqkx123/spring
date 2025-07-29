import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { EmployeeList } from '../components/EmployeeList';
import { EmployeeImport } from '../components/EmployeeImport';
import { EmployeeExport } from '../components/EmployeeExport';
import { useEmployeeListState } from '../hooks/useEmployees';
import type { Employee } from '../../../types';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [
    importModalOpened,
    { open: openImportModal, close: closeImportModal },
  ] = useDisclosure(false);
  const [
    exportModalOpened,
    { open: openExportModal, close: closeExportModal },
  ] = useDisclosure(false);

  const { selectedEmployees } = useEmployeeListState();

  const handleCreateEmployee = () => {
    navigate('/employees/new');
  };

  const handleEditEmployee = (employee: Employee) => {
    navigate(`/employees/${employee.id}/edit`);
  };

  const handleViewEmployee = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleImportSuccess = (importedEmployees: Employee[]) => {
    // The list will automatically refresh due to query invalidation
    closeImportModal();
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Title order={1}>Employees</Title>

        <EmployeeList
          onCreateEmployee={handleCreateEmployee}
          onEditEmployee={handleEditEmployee}
          onViewEmployee={handleViewEmployee}
          onImportEmployees={openImportModal}
          onExportEmployees={openExportModal}
        />

        {/* Import Modal */}
        <EmployeeImport
          opened={importModalOpened}
          onClose={closeImportModal}
          onSuccess={handleImportSuccess}
        />

        {/* Export Modal */}
        <EmployeeExport
          opened={exportModalOpened}
          onClose={closeExportModal}
          selectedEmployees={selectedEmployees}
        />
      </Stack>
    </Container>
  );
};
