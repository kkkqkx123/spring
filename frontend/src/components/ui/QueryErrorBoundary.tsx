import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Button, Container, Text, Title, Stack, Alert } from '@mantine/core';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class QueryErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (import.meta.env.PROD) {
      console.error('Query Error Boundary caught an error:', error, errorInfo);
      // TODO: Send to error reporting service (e.g., Sentry)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
            <Text ta="center" c="dimmed">
              An error occurred while loading data. Please try refreshing the
              page.
            </Text>

            {import.meta.env.DEV && this.state.error && (
              <Alert
                title="Error Details (Development Only)"
                color="red"
                variant="outline"
                style={{ width: '100%', textAlign: 'left' }}
              >
                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text
                    size="xs"
                    c="dimmed"
                    mt="xs"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </Alert>
            )}

            <Button
              onClick={() => {
                this.setState({
                  hasError: false,
                  error: undefined,
                  errorInfo: undefined,
                });
                window.location.reload();
              }}
            >
              🔄 Refresh Page
            </Button>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Wrapper component that combines QueryErrorResetBoundary with our custom error boundary
export const QueryErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <QueryErrorBoundaryClass
          fallback={
            fallback || (
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
                  <Text ta="center" c="dimmed">
                    An error occurred while loading data.
                  </Text>
                  <Button onClick={reset}>🔄 Try Again</Button>
                </Stack>
              </Container>
            )
          }
        >
          {children}
        </QueryErrorBoundaryClass>
      )}
    </QueryErrorResetBoundary>
  );
};
