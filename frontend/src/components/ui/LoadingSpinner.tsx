import React from 'react';
import { Loader, Overlay, Center, Stack, Text, Box } from '@mantine/core';
import type { LoadingSpinnerProps } from '../../types';

const sizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
};

export function LoadingSpinner({
  size = 'md',
  overlay = false,
  text,
  color,
  ariaLabel,
  centered,
  ...props
}: LoadingSpinnerProps &
  React.ComponentPropsWithoutRef<'div'> & {
    text?: string;
    color?: string;
    ariaLabel?: string;
    centered?: boolean;
  }) {
  const loaderSize = sizeMap[size];

  const LoaderContent = (
    <Stack
      align="center"
      gap="sm"
      role="status"
      aria-label={ariaLabel || 'Loading'}
      data-size={size}
      data-color={color}
    >
      <Loader size={loaderSize} color={color} />
      {text && (
        <Text size="sm" c="dimmed" ta="center">
          {text}
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
        <Center h="100%" className="overlay">
          {LoaderContent}
        </Center>
      </Overlay>
    );
  }

  if (centered) {
    return (
      <Center className="centered" {...props}>
        {LoaderContent}
      </Center>
    );
  }

  return <Center {...props}>{LoaderContent}</Center>;
}

// Specialized loading spinner variants
export function PageLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <Center h="50vh">
      <LoadingSpinner size="lg" text={text} />
    </Center>
  );
}

export function InlineLoadingSpinner({
  size = 'sm',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  return <LoadingSpinner size={size} />;
}

export function OverlayLoadingSpinner({
  text = 'Loading...',
  visible = true,
}: {
  text?: string;
  visible?: boolean;
}) {
  if (!visible) return null;

  return (
    <LoadingSpinner
      overlay
      text={text}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}

// Full page loading spinner for route transitions
export function FullPageLoadingSpinner({
  text = 'Loading application...',
}: {
  text?: string;
}) {
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
        <LoadingSpinner size="lg" text={text} />
      </Center>
    </Box>
  );
}
