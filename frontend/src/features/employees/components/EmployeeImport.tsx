import React, { useState, useCallback, useRef } from 'react';
import {
  Modal,
  Button,
  Text,
  Group,
  Stack,
  Alert,
  Progress,
  Table,
  ScrollArea,
  ActionIcon,
  Paper,
  rem,
} from '@mantine/core';
import {
  IconUpload,
  IconFileSpreadsheet,
  IconDownload,
  IconX,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { useEmployeeImport } from '../hooks/useEmployees';
import type { Employee } from '../../../types';

interface EmployeeImportProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: (importedEmployees: Employee[]) => void;
}

interface ImportPreviewData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentName: string;
  positionName: string;
  hireDate: string;
  salary?: number;
  status: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const EmployeeImport: React.FC<EmployeeImportProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<FileWithPath | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useEmployeeImport();

  const validateImportData = useCallback(
    (data: ImportPreviewData[]): ValidationError[] => {
      const errors: ValidationError[] = [];

      data.forEach((row, index) => {
        const rowNumber = index + 1;

        // Required field validations
        if (!row.employeeNumber?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'employeeNumber',
            message: 'Employee number is required',
          });
        }

        if (!row.firstName?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'firstName',
            message: 'First name is required',
          });
        }

        if (!row.lastName?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'lastName',
            message: 'Last name is required',
          });
        }

        if (!row.email?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'email',
            message: 'Email is required',
          });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push({
            row: rowNumber,
            field: 'email',
            message: 'Invalid email format',
          });
        }

        if (!row.departmentName?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'departmentName',
            message: 'Department is required',
          });
        }

        if (!row.positionName?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'positionName',
            message: 'Position is required',
          });
        }

        if (!row.hireDate?.trim()) {
          errors.push({
            row: rowNumber,
            field: 'hireDate',
            message: 'Hire date is required',
          });
        } else if (isNaN(Date.parse(row.hireDate))) {
          errors.push({
            row: rowNumber,
            field: 'hireDate',
            message: 'Invalid date format',
          });
        }

        if (!['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(row.status)) {
          errors.push({
            row: rowNumber,
            field: 'status',
            message: 'Status must be ACTIVE, INACTIVE, or TERMINATED',
          });
        }
      });

      return errors;
    },
    []
  );

  const processFilePreview = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setPreviewData([]);
      setValidationErrors([]);

      try {
        // For demo purposes, we'll simulate file processing
        // In a real implementation, you'd use a library like xlsx or papaparse
        const reader = new FileReader();

        reader.onload = () => {
          try {
            // Simulate parsing Excel/CSV data
            const mockData: ImportPreviewData[] = [
              {
                employeeNumber: 'EMP001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@company.com',
                phone: '+1234567890',
                departmentName: 'Engineering',
                positionName: 'Software Developer',
                hireDate: '2024-01-15',
                salary: 75000,
                status: 'ACTIVE',
              },
              {
                employeeNumber: 'EMP002',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@company.com',
                phone: '',
                departmentName: 'Marketing',
                positionName: 'Marketing Manager',
                hireDate: '2024-02-01',
                salary: 65000,
                status: 'ACTIVE',
              },
            ];

            // Validate data
            const errors = validateImportData(mockData);
            setValidationErrors(errors);
            setPreviewData(mockData);
          } catch {
            notifications.show({
              title: 'File Processing Error',
              message: 'Unable to process the selected file',
              color: 'red',
              icon: <IconAlertCircle size={16} />,
            });
          }
        };

        reader.readAsArrayBuffer(file);
      } catch {
        notifications.show({
          title: 'File Processing Error',
          message: 'Unable to process the selected file',
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [validateImportData]
  );

  const handleFileSelect = useCallback(
    (files: FileWithPath[]) => {
      const selectedFile = files[0];
      if (!selectedFile) return;

      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        notifications.show({
          title: 'Invalid File Type',
          message: 'Please select an Excel (.xlsx, .xls) or CSV file',
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        notifications.show({
          title: 'File Too Large',
          message: 'File size must be less than 10MB',
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
        return;
      }

      setFile(selectedFile);
      processFilePreview(selectedFile);
    },
    [processFilePreview]
  );

  const handleClose = useCallback(() => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setIsProcessing(false);
    setUploadProgress(0);
    onClose();
  }, [onClose]);

  const handleImport = useCallback(async () => {
    if (!file || validationErrors.length > 0) return;

    try {
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await importMutation.mutateAsync(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      notifications.show({
        title: 'Import Successful',
        message: `Successfully imported ${result.length} employees`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      onSuccess?.(result);
      handleClose();
    } catch {
      notifications.show({
        title: 'Import Failed',
        message: 'Failed to import employees. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    }
  }, [file, validationErrors, importMutation, onSuccess, handleClose]);

  const downloadTemplate = useCallback(() => {
    // Create a sample CSV template
    const headers = [
      'employeeNumber',
      'firstName',
      'lastName',
      'email',
      'phone',
      'departmentName',
      'positionName',
      'hireDate',
      'salary',
      'status',
    ];

    const sampleData = [
      'EMP001,John,Doe,john.doe@company.com,+1234567890,Engineering,Software Developer,2024-01-15,75000,ACTIVE',
      'EMP002,Jane,Smith,jane.smith@company.com,,Marketing,Marketing Manager,2024-02-01,65000,ACTIVE',
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifications.show({
      title: 'Template Downloaded',
      message: 'Employee import template has been downloaded',
      color: 'blue',
      icon: <IconDownload size={16} />,
    });
  }, []);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import Employees"
      size="xl"
      closeOnClickOutside={!isProcessing}
      closeOnEscape={!isProcessing}
    >
      <Stack>
        <Group>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={downloadTemplate}
            variant="outline"
          >
            Download Template
          </Button>
        </Group>

        <Dropzone
          onDrop={handleFileSelect}
          onReject={files => console.log('rejected files', files)}
          maxSize={10 * 1024 ** 2}
          accept={[
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
          ]}
          ref={fileInputRef}
          loading={isProcessing}
        >
          <Group
            justify="center"
            gap="xl"
            mih={220}
            style={{ pointerEvents: 'none' }}
          >
            <Dropzone.Accept>
              <IconUpload
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: 'var(--mantine-color-blue-6)',
                }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: 'var(--mantine-color-red-6)',
                }}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileSpreadsheet
                style={{
                  width: rem(52),
                  height: rem(52),
                  color: 'var(--mantine-color-dimmed)',
                }}
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                Drag and drop a file here or click to select
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Attach one file, should not exceed 10MB
              </Text>
            </div>
          </Group>
        </Dropzone>

        {file && (
          <Paper withBorder p="md" mt="md">
            <Group>
              <IconFileSpreadsheet size={24} />
              <Text>{file.name}</Text>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => setFile(null)}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Paper>
        )}

        {uploadProgress > 0 && (
          <Progress value={uploadProgress} striped animated />
        )}

        {validationErrors.length > 0 && (
          <Alert
            title="Validation Errors"
            color="red"
            icon={<IconAlertCircle size={16} />}
          >
            <ScrollArea h={200}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Row</Table.Th>
                    <Table.Th>Field</Table.Th>
                    <Table.Th>Message</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {validationErrors.map((error, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{error.row}</Table.Td>
                      <Table.Td>{error.field}</Table.Td>
                      <Table.Td>{error.message}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Alert>
        )}

        {previewData.length > 0 && validationErrors.length === 0 && (
          <Paper withBorder p="md" mt="md">
            <Text fw={500}>Data Preview</Text>
            <ScrollArea h={200}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Employee #</Table.Th>
                    <Table.Th>First Name</Table.Th>
                    <Table.Th>Last Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {previewData.map((row, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{row.employeeNumber}</Table.Td>
                      <Table.Td>{row.firstName}</Table.Td>
                      <Table.Td>{row.lastName}</Table.Td>
                      <Table.Td>{row.email}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        )}

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || validationErrors.length > 0 || isProcessing}
            loading={importMutation.isPending}
          >
            Import
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
