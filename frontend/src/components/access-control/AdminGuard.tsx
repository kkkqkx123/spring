import React from 'react';
import { useAccessControl } from '../../hooks/useAccessControl';
import { Alert, Stack, Text, Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

export interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Component that only renders children for admin users
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  const { isAdmin } = useAccessControl();

  if (isAdmin) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showFallback) {
    return (
      <Alert
        icon={<IconLock size="1rem" />}
        title="Admin Access Required"
        color="red"
        variant="light"
      >
        <Stack gap="xs">
          <Text size="sm">
            This feature is only available to administrators.
          </Text>
          <Button
            variant="light"
            size="sm"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Stack>
      </Alert>
    );
  }

  return null;
};

export default AdminGuard;
