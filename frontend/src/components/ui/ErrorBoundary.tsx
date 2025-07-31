import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  Button,
  Container,
  Text,
  Title,
  Stack,
  Alert,
  Group,
} from '@mantine/core';
import { IconRefresh, IconBug, IconHome } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substr(2, 9);
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Report error to monitoring service in production
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error reporting service (e.g., Sentry)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    console.error('Error Report:', errorReport);

    // In a real application, send to error reporting service:
    // errorReportingService.captureException(error, {
    //   extra: errorReport,
    //   tags: { errorBoundary: true }
    // });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const showDetails = this.props.showErrorDetails ?? import.meta.env.DEV;

      return (
        <Container size="sm" py="xl">
          <Stack align="center" gap="md">
            <div
              style={{
                fontSize: '64px',
                color: 'var(--mantine-color-red-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ⚠️
            </div>

            <Title order={2} ta="center">
              Something went wrong
            </Title>

            <Text ta="center" c="dimmed" size="lg">
              An unexpected error occurred. We apologize for the inconvenience.
            </Text>

            {this.state.errorId && (
              <Text ta="center" c="dimmed" size="sm">
                Error ID: {this.state.errorId}
              </Text>
            )}

            <Group justify="center" gap="md">
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleRetry}
                variant="filled"
              >
                Try Again
              </Button>

              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleRefresh}
                variant="outline"
              >
                Refresh Page
              </Button>

              <Button
                leftSection={<IconHome size={16} />}
                onClick={this.handleGoHome}
                variant="subtle"
              >
                Go Home
              </Button>
            </Group>

            {showDetails && this.state.error && (
              <Alert
                title="Error Details"
                color="red"
                variant="outline"
                icon={<IconBug size={16} />}
                style={{ width: '100%', textAlign: 'left', marginTop: '2rem' }}
              >
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {this.state.error.name}: {this.state.error.message}
                  </Text>

                  {this.state.error.stack && (
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      {this.state.error.stack}
                    </Text>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <>
                      <Text size="sm" fw={500} mt="md">
                        Component Stack:
                      </Text>
                      <Text
                        size="xs"
                        c="dimmed"
                        style={{
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '150px',
                          overflow: 'auto',
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                </Stack>
              </Alert>
            )}
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
