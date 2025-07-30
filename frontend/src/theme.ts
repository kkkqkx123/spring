import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Define custom colors
const primaryColor: MantineColorsTuple = [
  '#e3f2fd',
  '#bbdefb',
  '#90caf9',
  '#64b5f6',
  '#42a5f5',
  '#2196f3',
  '#1e88e5',
  '#1976d2',
  '#1565c0',
  '#0d47a1',
];

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    primary: primaryColor,
  },
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  focusRing: 'auto',
  // Enhanced responsive breakpoints
  breakpoints: {
    xs: '36em', // 576px
    sm: '48em', // 768px
    md: '62em', // 992px
    lg: '75em', // 1200px
    xl: '87.5em', // 1400px
  },
  // Responsive spacing scale
  spacing: {
    xs: '0.625rem', // 10px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.25rem', // 20px
    xl: '1.5rem', // 24px
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          // Touch-friendly minimum size on mobile
          '@media (max-width: 48em)': {
            minHeight: '44px',
            minWidth: '44px',
          },
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          // Larger touch targets on mobile
          '@media (max-width: 48em)': {
            minHeight: '44px',
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          '@media (max-width: 48em)': {
            minHeight: '44px',
            fontSize: '16px',
          },
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
      styles: {
        root: {
          // Reduced padding on mobile
          '@media (max-width: 48em)': {
            padding: 'var(--mantine-spacing-sm)',
          },
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        shadow: 'xl',
      },
      styles: {
        content: {
          // Full screen on mobile
          '@media (max-width: 48em)': {
            margin: '0',
            maxWidth: '100vw',
            maxHeight: '100vh',
            borderRadius: '0',
          },
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    Table: {
      styles: {
        table: {
          // Responsive table behavior
          '@media (max-width: 62em)': {
            fontSize: '0.875rem',
          },
        },
        th: {
          '@media (max-width: 48em)': {
            padding: '0.5rem',
          },
        },
        td: {
          '@media (max-width: 48em)': {
            padding: '0.5rem',
          },
        },
      },
    },
    AppShell: {
      styles: {
        navbar: {
          // Improved mobile navbar
          '@media (max-width: 48em)': {
            zIndex: 1000,
          },
        },
      },
    },
  },
});
