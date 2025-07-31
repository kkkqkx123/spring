import React, { useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Alert,
  Badge,
  List,
  LoadingOverlay,
  Divider,
} from '@mantine/core';
import { IconAlertTriangle, IconUsers, IconShield, IconExclamationMark } from '@tabler/icons-react';
import type { UseMutationResult } from '@tanstack/react-query';

interface PermissionImpactAnalysis {
  affectedUsers: number;
  affectedFeatures: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
}

interface PermissionImpactDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roleId?: number;
  permissionIds?: number[];
  analyzeImpact: UseMutationResult<PermissionImpactAnalysis, Error, { roleId: number; permissionIds: number[] }>;
  loading?: boolean;
}

export const PermissionImpactDialog: React.FC<PermissionImpactDialogProps> = ({
  opened,
  onClose,
  onConfirm,
  roleId,
  permissionIds,
  analyzeImpact,
  loading = false,
}) => {
  // Trigger impact analysis when dialog opens
  useEffect(() => {
    if (opened && roleId && permissionIds) {
      analyzeImpact.mutate({ roleId, permissionIds });
    }
  }, [opened, roleId, permissionIds, analyzeImpact]);

  const impactData = analyzeImpact.data;
  const isAnalyzing = analyzeImpact.isPending;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'yellow';
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <IconExclamationMark size={16} />;
      case 'MEDIUM':
        return <IconAlertTriangle size={16} />;
      case 'LOW':
        return <IconShield size={16} />;
      default:
        return <IconShield size={16} />;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Permission Change Impact Analysis"
      size="md"
    >
      <Stack gap="md">
        {isAnalyzing ? (
          <div style={{ position: 'relative', minHeight: 200 }}>
            <LoadingOverlay visible />
            <Text ta="center" c="dimmed">
              Analyzing permission impact...
            </Text>
          </div>
        ) : impactData ? (
          <>
            {/* Risk Level */}
            <Alert
              icon={getRiskIcon(impactData.riskLevel)}
              color={getRiskColor(impactData.riskLevel)}
              title={`${impactData.riskLevel} Risk Level`}
            >
              This permission change has been classified as {impactData.riskLevel.toLowerCase()} risk.
            </Alert>

            {/* Affected Users */}
            <Group gap="xs">
              <IconUsers size={16} />
              <Text size="sm" fw={500}>
                Affected Users:
              </Text>
              <Badge color="blue" variant="light">
                {impactData.affectedUsers} user{impactData.affectedUsers !== 1 ? 's' : ''}
              </Badge>
            </Group>

            {/* Affected Features */}
            {impactData.affectedFeatures.length > 0 && (
              <>
                <Text size="sm" fw={500}>
                  Affected Features:
                </Text>
                <List size="sm">
                  {impactData.affectedFeatures.map((feature, index) => (
                    <List.Item key={index}>{feature}</List.Item>
                  ))}
                </List>
              </>
            )}

            {/* Warnings */}
            {impactData.warnings.length > 0 && (
              <>
                <Divider />
                <Text size="sm" fw={500} c="orange">
                  Warnings:
                </Text>
                <List size="sm">
                  {impactData.warnings.map((warning, index) => (
                    <List.Item key={index} c="orange">
                      {warning}
                    </List.Item>
                  ))}
                </List>
              </>
            )}

            {/* Confirmation Message */}
            <Alert
              icon={<IconAlertTriangle size={16} />}
              color="orange"
              variant="light"
            >
              <Text size="sm">
                Are you sure you want to proceed with this permission change? 
                This action will immediately affect {impactData.affectedUsers} user{impactData.affectedUsers !== 1 ? 's' : ''}.
              </Text>
            </Alert>
          </>
        ) : (
          <Alert
            icon={<IconExclamationMark size={16} />}
            color="red"
            title="Analysis Failed"
          >
            Unable to analyze the impact of this permission change. Please try again.
          </Alert>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="orange"
            onClick={onConfirm}
            loading={loading}
            disabled={isAnalyzing || !impactData}
          >
            Confirm Changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PermissionImpactDialog;