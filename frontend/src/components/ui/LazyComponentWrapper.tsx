import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Center, Alert, Button, Stack } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { LoadingSkeleton } from './LoadingSkeleton';

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  skeletonVariant?: 'page' | 'list' | 'form' | 'card' | 'table';
}

const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <Center h="50vh">
    <Stack align="center" gap="md">
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Failed to load component"
        color="red"
        variant="light"
      >
        {error.message || 'An unexpected error occurred while loading this component.'}
      </Alert>
      <Button
        leftSection={<IconRefresh size={16} />}
        onClick={resetErrorBoundary}
        variant="outline"
      >
        Try Again
      </Button>
    </Stack>
  </Center>
);

const DefaultLoadingFallback: React.FC<{ skeletonVariant?: string }> = ({ skeletonVariant }) => (
  <LoadingSkeleton variant={skeletonVariant as any} />
);

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  children,
  fallback: CustomFallback,
  errorFallback: CustomErrorFallback,
  skeletonVariant = 'page',
}) => {
  const LoadingComponent = CustomFallback || (() => <DefaultLoadingFallback skeletonVariant={skeletonVariant} />);
  const ErrorComponent = CustomErrorFallback || DefaultErrorFallback;

  return (
    <ErrorBoundary
      FallbackComponent={ErrorComponent}
      onError={(error, errorInfo) => {
        // Log error for monitoring
        console.error('Lazy component error:', error, errorInfo);
      }}
    >
      <Suspense fallback={<LoadingComponent />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};