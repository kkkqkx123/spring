import React from 'react';
import { Button, ButtonProps, Loader } from '@mantine/core';
import { useReducedMotion } from '../../utils/accessibility';

interface AccessibleButtonProps extends ButtonProps {
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  loading?: boolean;
  loadingText?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  ariaLabel,
  ariaDescribedBy,
  loading = false,
  loadingText = 'Loading',
  disabled,
  onClick,
  ...buttonProps
}) => {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Ensure Enter and Space keys work properly
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!loading && !disabled) {
        onClick?.(event as any);
      }
    }
  };

  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      style={{
        ...buttonProps.style,
        // Ensure minimum touch target size
        minHeight: '44px',
        minWidth: '44px',
        // Respect reduced motion preference
        transition: prefersReducedMotion ? 'none' : buttonProps.style?.transition,
      }}
      styles={{
        ...buttonProps.styles,
        root: {
          ...buttonProps.styles?.root,
          // Enhanced focus styles
          '&:focus-visible': {
            outline: '2px solid var(--mantine-color-blue-6)',
            outlineOffset: '2px',
            boxShadow: '0 0 0 2px var(--mantine-color-blue-2)',
          },
          // High contrast mode support
          '@media (prefers-contrast: high)': {
            border: '2px solid currentColor',
          },
        },
      }}
    >
      {loading ? (
        <>
          <Loader size="sm" mr="xs" />
          <span aria-live="polite">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
};