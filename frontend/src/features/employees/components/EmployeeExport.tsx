/* eslint-disable prettier/prettier */
import React, { useState, useCallback } from 'react';
import {
  Modal,
  Button,
  Text,
  Group,
  Stack,
  Checkbox,
  Paper,
  ScrollArea,
  Alert,
  Progress,
} from '@mantine/core';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEmployeeExport } from '../hooks/useEmployees';
import type { Employee } from '../../../types';

interface EmployeeExportProps {
  opened: boolean;
  onClose: () => void;
  selectedEmployees?: number[];
  allEmployees?: Employee[];
}

interface ExportField {
  key: keyof Employee | string;
  label: string;
  selected: boolean;
}

const defaultExportFields: ExportField[] = [
  { key: 'employeeNumber', label: 'Employee Number', selected: true },
  { key: 'firstName', label: 'First Name', selected: true },
  { key: 'lastName', label: 'Last Name', selected: true },
  { key: 'email', label: 'Email', selected: true },
  { key: 'phone', label: 'Phone', selected: true },
  { key: 'department.name', label: 'Department', selected: true },
  { key: 'position.name', label: 'Position', selected: true },
  { key: 'hireDate', label: 'Hire Date', selected: true },
  { key: 'salary', label: 'Salary', selected: false },
  { key: 'status', label: 'Status', selected: true },
  { key: 'profilePicture', label: 'Profile Picture URL', selected: false },
];

export const EmployeeExport: React.FC<EmployeeExportProps> = ({
  opened,
  onClose,
  selectedEmployees = [],
  allEmployees = [],
}) => {
  const [exportFields, setExportFields] = useState<ExportField[]>(defaultExportFields);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = useEmployeeExport();

  const handleFieldToggle = useCallback((fieldKey: string) => {
    setExportFields(prev =>
      prev.map(field =>
        field.key === fieldKey
          ? { ...field, selected: !field.selected }
          : field
      )
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allSelected = exportFields.every(field => field.selected);
    setExportFields(prev =>
      prev.map(field => ({ ...field, selected: !allSelected }))
    );
  }, [exportFields]);

  const handleExport = useCallback(async () => {
    const selectedFields = exportFields.filter(field => field.selected);
    
    if (selectedFields.length === 0) {
      notifications.show({
        title: 'No Fields Selected',
        message: 'Please select at least one field to export',
        color: 'orange',
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const exportIds = selectedEmployees.length > 0 ? selectedEmployees : undefined;
      const blob = await exportMutation.mutateAsync(exportIds);
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notifications.show({
        title: 'Export Successful',
        message: `Successfully exported ${selectedEmployees.length > 0 ? selectedEmployees.length : 'all'} employees`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      onClose();
    } catch (error) {
      notifications.show({
        title: 'Export Failed',
        message: 'Failed to export employees. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [exportFields, selectedEmployees, exportMutation, onClose]);

  const handleClose = useCallback(() => {
    setExportFields(defaultExportFields);
    setExportProgress(0);
    setIsExporting(false);
    onClose();
  }, [onClose]);

  const selectedFieldsCount = exportFields.filter(field => field.selected).length;
  const exportCount = selectedEmployees.length > 0 ? selectedEmployees.length : allEmployees.length;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Export Employees"
      size="md"
      centered
    >
      <Stack gap="md">
        {/* Export Summary */}
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Text fw={500}>Export Summary</Text>
              <Text size="sm" c="dimmed">
                {selectedEmployees.length > 0
                  ? `${selectedEmployees.length} selected employees`
                  : `All employees (${allEmployees.length})`}
              </Text>
            </div>
            <IconFileSpreadsheet size={24} />
          </Group>
        </Paper>

        {/* Field Selection */}
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500}>Select Fields to Export</Text>
            <Button
              variant="subtle"
              size="xs"
              onClick={handleSelectAll}
            >
              {exportFields.every(field => field.selected) ? 'Deselect All' : 'Select All'}
            </Button>
          </Group>

          <Paper p="md" withBorder>
            <ScrollArea.Autosize mah={300}>
              <Stack gap="xs">
                {exportFields.map((field) => (
                  <Checkbox
                    key={field.key}
                    label={field.label}
                    checked={field.selected}
                    onChange={() => handleFieldToggle(field.key)}
                  />
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </Paper>

          <Text size="sm" c="dimmed">
            {selectedFieldsCount} of {exportFields.length} fields selected
          </Text>
        </Stack>

        {/* Export Progress */}
        {isExporting && (
          <Stack gap="sm">
            <Text>Exporting employees...</Text>
            <Progress value={exportProgress} />
          </Stack>
        )}

        {/* Warning for sensitive data */}
        {exportFields.some(field => field.key === 'salary' && field.selected) && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Sensitive Data Warning"
            color="orange"
          >
            <Text size="sm">
              You have selected to export salary information. Please ensure you have
              the necessary permissions and handle this data securely.
            </Text>
          </Alert>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFieldsCount === 0 || isExporting}
            loading={isExporting}
            leftSection={<IconDownload size={16} />}
          >
            Export to Excel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};