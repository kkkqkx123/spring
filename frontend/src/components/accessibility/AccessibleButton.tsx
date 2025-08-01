import React from 'react';
import {
  Button,
  type ButtonProps,
  Loader,
  type MantineTheme,
  type CSSProperties,
  type ButtonStylesNames,
  type MantineStyleProp,
} from '@mantine/core';
import { useReducedMotion } from '../../utils/accessibility';

type Styles =
  | Partial<Record<ButtonStylesNames, CSSProperties>>
  | ((
      theme: MantineTheme,
      props: ButtonProps,
      ctx: unknown
    ) => Partial<Record<ButtonStylesNames, CSSProperties>>);

const mergeStyles = (
  baseStyles: Styles | undefined,
  newStyles: Partial<Record<ButtonStylesNames, CSSProperties>>
): Styles => {
  if (typeof baseStyles === 'function') {
    return (theme, props, ctx) => {
      const base = baseStyles(theme, props, ctx);
      return {
        ...base,
        ...newStyles,
        root: {
          ...base.root,
          ...newStyles.root,
        },
      };
    };
  }

  return {
    ...baseStyles,
    ...newStyles,
    root: {
      ...baseStyles?.root,
      ...newStyles.root,
    },
  };
};

const getFinalStyle = (
  baseStyle: MantineStyleProp | undefined,
  prefersReducedMotion: boolean
): MantineStyleProp => {
  const newStyle: CSSProperties = {
    minHeight: '44px',
    minWidth: '44px',
  };

  if (prefersReducedMotion) {
    newStyle.transition = 'none';
  }

  if (typeof baseStyle === 'function') {
    return (theme: MantineTheme) => ({
      ...(baseStyle(theme) as CSSProperties),
      ...newStyle,
    });
  }

  if (Array.isArray(baseStyle)) {
    return [...baseStyle, newStyle];
  }

  return {
    ...baseStyle,
    ...newStyle,
  };
};

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

  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      style={getFinalStyle(buttonProps.style, prefersReducedMotion)}
      styles={mergeStyles(buttonProps.styles, {
        root: {
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
      })}
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
