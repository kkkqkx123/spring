import React from 'react';
import { Loader, Overlay, Center, Stack, Text, Box } from '@mantine/core';
import { LoadingSpinnerProps } from '../../types';

const sizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
};

export function LoadingSpinner({ 
  size = 'md', 
  overlay = false,
  message,
  ...props 
}: LoadingSpinnerProps & { 
  message?: string;
  [key: string]: any;
}) {
  const loaderSize = sizeMap[size];

  const LoaderContent = (
    <Stack align="center" gap="sm">
      <Loader size={loaderSize} />
      {message && (
        <Text size="sm" c="dimmed" ta="center">
          {message}
        </Text>
      )}
    </Stack>
  );

  if (overlay) {
    return (
      <Overlay 
        color="#fff" 
        backgroundOpacity={0.8} 
        blur={2}
        zIndex={1000}
        {...props}
      >
        <Center h="100%">
          {LoaderContent}
        </Center>
      </Overlay>
    );
  }

  return (
    <Center {...props}>
      {LoaderContent}
    </Center>
  );
}

// Specialized loading spinner variants
export function PageLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <Center h="50vh">
      <LoadingSpinner size="lg" message={message} />
    </Center>
  );
}

export function InlineLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <LoadingSpinner size={size} />;
}

export function OverlayLoadingSpinner({ 
  message = "Loading...",
  visible = true 
}: { 
  message?: string;
  visible?: boolean;
}) {
  if (!visible) return null;
  
  return (
    <LoadingSpinner 
      overlay 
      message={message}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}

// Full page loading spinner for route transitions
export function FullPageLoadingSpinner({ message = "Loading application..." }: { message?: string }) {
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--mantine-color-white)',
        zIndex: 9999,
      }}
    >
      <Center h="100vh">
        <LoadingSpinner size="lg" message={message} />
      </Center>
    </Box>
  );
}