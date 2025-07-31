import React, { useState, useCallback } from 'react';
import {
  Button,
  Group,
  Text,
  Alert,
  Progress,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconRefresh,
  IconAlertCircle,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { processApiError, createRetryFunction } from '../../utils/errorHandler';
import type { ApiError } from '../../types';

interface RetryHandlerProps {
  onRetry: () => Promise<void>;
  error?: ApiError;
  maxRetries?: number;
  baseDelay?: number;
  showProgress?: boolean;
  children?: React.ReactNode;
}

/**
 * Component that handles retry logic with exponential backoff
 */
export const RetryHandler: React.FC<RetryHandlerProps> = ({
  onRetry,
  error,
  maxRetries = 3,
  baseDelay = 1000,
  showProgress = true,
  children,
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const processedError = error ? processApiError(error) : null;

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) return;

    setIsRetrying(true);
    const delay = baseDelay * Math.pow(2, retryCount);

    // Show countdown if delay is significant
    if (delay > 1000 && showProgress) {
      setCountdown(delay);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await onRetry();
      setRetryCount(0);
    } catch (retryError) {
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
      setCountdown(0);
    }
  }, [onRetry, retryCount, maxRetries, baseDelay, showProgress]);

  const resetRetry = () => {
    setRetryCount(0);
    setIsRetrying(false);
    setCountdown(0);
  };

  if (!error) {
    return <>{children}</>;
  }

  const canRetry = processedError?.retryable && retryCount < maxRetries;
  const hasExceededRetries = retryCount >= maxRetries;

  return (
    <Stack gap="md">
      <Alert
        icon={<IconAlertCircle size={16} />}
        title={processedError?.title || 'Error'}
        color={processedError?.type === 'warning' ? 'yellow' : 'red'}
        variant="light"
      >
        <Stack gap="sm">
          <Text size="sm">{processedError?.message}</Text>

          {processedError?.details && (
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
              {processedError.details}
            </Text>
          )}

          {canRetry && (
            <Group gap="sm" align="center">
              <Text size="xs" c="dimmed">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </Text>
              
              {showProgress && countdown > 0 && (
                <Group gap="xs" style={{ flex: 1 }}>
                  <IconClock size={14} />
                  <Progress
                    value={(baseDelay * Math.pow(2, retryCount) - countdown) / (baseDelay * Math.pow(2, retryCount)) * 100}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Text size="xs" c="dimmed">
                    {Math.ceil(countdown / 1000)}s
                  </Text>
                </Group>
              )}
            </Group>
          )}

          <Group gap="sm">
            {canRetry && (
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={handleRetry}
                loading={isRetrying}
                disabled={countdown > 0}
                size="sm"
                variant="light"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}

            {hasExceededRetries && (
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={resetRetry}
                size="sm"
                variant="outline"
              >
                Reset & Try Again
              </Button>
            )}

            <Tooltip label="Dismiss error">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={resetRetry}
                size="sm"
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
      </Alert>

      {children}
    </Stack>
  );
};

interface AutoRetryWrapperProps {
  children: React.ReactNode;
  onError?: (error: ApiError) => void;
  maxRetries?: number;
  baseDelay?: number;
  retryCondition?: (error: ApiError) => boolean;
}

/**
 * Higher-order component that automatically retries failed operations
 */
export const AutoRetryWrapper: React.FC<AutoRetryWrapperProps> = ({
  children,
  onError,
  maxRetries = 3,
  baseDelay = 1000,
  retryCondition,
}) => {
  const [error, setError] = useState<ApiError | null>(null);
  const [retryFunction, setRetryFunction] = useState<(() => Promise<void>) | null>(null);

  const handleError = useCallback((error: ApiError, retryFn: () => Promise<void>) => {
    const processedError = processApiError(error);
    
    // Check if error should be retried
    const shouldRetry = retryCondition ? retryCondition(error) : processedError.retryable;
    
    if (shouldRetry) {
      setError(error);
      setRetryFunction(() => retryFn);
    } else {
      onError?.(error);
    }
  }, [onError, retryCondition]);

  const handleRetry = useCallback(async () => {
    if (retryFunction) {
      try {
        await retryFunction();
        setError(null);
        setRetryFunction(null);
      } catch (retryError) {
        setError(retryError as ApiError);
      }
    }
  }, [retryFunction]);

  // Provide error handler to children through context or props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onError: handleError,
      } as any);
    }
    return child;
  });

  return (
    <RetryHandler
      onRetry={handleRetry}
      error={error || undefined}
      maxRetries={maxRetries}
      baseDelay={baseDelay}
    >
      {childrenWithProps}
    </RetryHandler>
  );
};

/**
 * Hook for handling retry logic in components
 */
export const useRetry = (
  operation: () => Promise<void>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    onError?: (error: ApiError) => void;
    onSuccess?: () => void;
  }
) => {
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 1000;

  const execute = useCallback(async () => {
    try {
      setError(null);
      await operation();
      setRetryCount(0);
      options?.onSuccess?.();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      options?.onError?.(apiError);
    }
  }, [operation, options]);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) return;

    setIsRetrying(true);
    const delay = baseDelay * Math.pow(2, retryCount);

    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await operation();
      setError(null);
      setRetryCount(0);
      options?.onSuccess?.();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      setRetryCount(prev => prev + 1);
      options?.onError?.(apiError);
    } finally {
      setIsRetrying(false);
    }
  }, [operation, retryCount, maxRetries, baseDelay, options]);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const processedError = error ? processApiError(error) : null;
  const canRetry = processedError?.retryable && retryCount < maxRetries;

  return {
    execute,
    retry,
    reset,
    error,
    processedError,
    retryCount,
    isRetrying,
    canRetry,
    hasExceededRetries: retryCount >= maxRetries,
  };
};