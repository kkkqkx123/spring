import React from 'react';
import {
  Progress,
  Text,
  Stack,
  Group,
  RingProgress,
  Center,
  Box,
  Card,
  Button,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconClock,
  IconPause,
  IconPlay,
  IconRefresh,
} from '@tabler/icons-react';

interface LinearProgressProps {
  value: number;
  label?: string;
  description?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  label,
  description,
  color = 'blue',
  size = 'md',
  showPercentage = true,
  animated = false,
  striped = false,
}) => {
  return (
    <Stack gap="xs">
      {label && (
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {showPercentage && (
            <Text size="sm" c="dimmed">
              {Math.round(value)}%
            </Text>
          )}
        </Group>
      )}
      
      <Progress
        value={value}
        color={color}
        size={size}
        animated={animated}
        striped={striped}
        style={{
          transition: 'all 0.3s ease',
        }}
      />
      
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
    </Stack>
  );
};

interface CircularProgressProps {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
  sections?: Array<{
    value: number;
    color: string;
    tooltip?: string;
  }>;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  thickness = 12,
  color = 'blue',
  label,
  showPercentage = true,
  sections,
}) => {
  return (
    <Stack align="center" gap="xs">
      <RingProgress
        size={size}
        thickness={thickness}
        sections={sections || [{ value, color }]}
        label={
          showPercentage ? (
            <Center>
              <Text size="xl" fw={700}>
                {Math.round(value)}%
              </Text>
            </Center>
          ) : undefined
        }
      />
      
      {label && (
        <Text size="sm" ta="center" fw={500}>
          {label}
        </Text>
      )}
    </Stack>
  );
};

interface StepProgressProps {
  steps: Array<{
    label: string;
    description?: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }>;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  orientation = 'horizontal',
  size = 'md',
}) => {
  const getStepIcon = (status: StepProgressProps['steps'][0]['status']) => {
    switch (status) {
      case 'completed':
        return <IconCheck size={16} color="white" />;
      case 'error':
        return <IconX size={16} color="white" />;
      case 'active':
        return <IconClock size={16} color="white" />;
      default:
        return null;
    }
  };

  const getStepColor = (status: StepProgressProps['steps'][0]['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'active':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (orientation === 'vertical') {
    return (
      <Stack gap="md">
        {steps.map((step, index) => (
          <Group key={index} align="flex-start" gap="md">
            <Center
              w={32}
              h={32}
              style={{
                borderRadius: '50%',
                backgroundColor: `var(--mantine-color-${getStepColor(step.status)}-6)`,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {getStepIcon(step.status) || (
                <Text size="sm" fw={700}>
                  {index + 1}
                </Text>
              )}
            </Center>
            
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {step.label}
              </Text>
              {step.description && (
                <Text size="xs" c="dimmed">
                  {step.description}
                </Text>
              )}
            </Stack>
          </Group>
        ))}
      </Stack>
    );
  }

  return (
    <Group justify="space-between" align="center" gap="xs">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <Stack align="center" gap="xs" style={{ flex: 1 }}>
            <Center
              w={32}
              h={32}
              style={{
                borderRadius: '50%',
                backgroundColor: `var(--mantine-color-${getStepColor(step.status)}-6)`,
                color: 'white',
              }}
            >
              {getStepIcon(step.status) || (
                <Text size="sm" fw={700}>
                  {index + 1}
                </Text>
              )}
            </Center>
            
            <Text size="xs" ta="center" fw={500}>
              {step.label}
            </Text>
            
            {step.description && (
              <Text size="xs" c="dimmed" ta="center">
                {step.description}
              </Text>
            )}
          </Stack>
          
          {index < steps.length - 1 && (
            <Box
              style={{
                height: 2,
                backgroundColor: `var(--mantine-color-${
                  steps[index + 1].status === 'completed' ? 'green' : 'gray'
                }-3)`,
                flex: 1,
                margin: '0 0.5rem',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Group>
  );
};

interface OperationProgressProps {
  title: string;
  description?: string;
  progress: number;
  status: 'running' | 'paused' | 'completed' | 'error' | 'cancelled';
  estimatedTime?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  details?: Array<{
    label: string;
    value: string | number;
  }>;
}

export const OperationProgress: React.FC<OperationProgressProps> = ({
  title,
  description,
  progress,
  status,
  estimatedTime,
  onPause,
  onResume,
  onCancel,
  onRetry,
  details,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'error':
      case 'cancelled':
        return 'red';
      case 'paused':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'In Progress';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="lg" fw={600}>
              {title}
            </Text>
            {description && (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            )}
          </Stack>
          
          <Group gap="xs">
            {status === 'running' && onPause && (
              <Tooltip label="Pause">
                <ActionIcon variant="subtle" onClick={onPause}>
                  <IconPause size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {status === 'paused' && onResume && (
              <Tooltip label="Resume">
                <ActionIcon variant="subtle" onClick={onResume}>
                  <IconPlay size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {(status === 'error' || status === 'cancelled') && onRetry && (
              <Tooltip label="Retry">
                <ActionIcon variant="subtle" onClick={onRetry}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            {(status === 'running' || status === 'paused') && onCancel && (
              <Tooltip label="Cancel">
                <ActionIcon variant="subtle" color="red" onClick={onCancel}>
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <LinearProgress
          value={progress}
          color={getStatusColor()}
          showPercentage={true}
          animated={status === 'running'}
        />

        <Group justify="space-between" align="center">
          <Text size="sm" c={getStatusColor()}>
            {getStatusText()}
          </Text>
          
          {estimatedTime && status === 'running' && (
            <Text size="sm" c="dimmed">
              Est. {estimatedTime} remaining
            </Text>
          )}
        </Group>

        {details && details.length > 0 && (
          <Stack gap="xs">
            {details.map((detail, index) => (
              <Group key={index} justify="space-between">
                <Text size="sm" c="dimmed">
                  {detail.label}:
                </Text>
                <Text size="sm" fw={500}>
                  {detail.value}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

// Hook for managing operation progress
export const useOperationProgress = () => {
  const [operations, setOperations] = React.useState<
    Map<string, OperationProgressProps>
  >(new Map());

  const startOperation = React.useCallback((
    id: string,
    operation: Omit<OperationProgressProps, 'progress' | 'status'>
  ) => {
    setOperations(prev => new Map(prev).set(id, {
      ...operation,
      progress: 0,
      status: 'running',
    }));
  }, []);

  const updateProgress = React.useCallback((
    id: string,
    progress: number,
    updates?: Partial<OperationProgressProps>
  ) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, {
          ...existing,
          progress,
          ...updates,
        });
      }
      return newMap;
    });
  }, []);

  const completeOperation = React.useCallback((id: string) => {
    updateProgress(id, 100, { status: 'completed' });
  }, [updateProgress]);

  const failOperation = React.useCallback((id: string, error?: string) => {
    updateProgress(id, 0, { 
      status: 'error',
      description: error,
    });
  }, [updateProgress]);

  const removeOperation = React.useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  return {
    operations: Array.from(operations.entries()),
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    removeOperation,
  };
};