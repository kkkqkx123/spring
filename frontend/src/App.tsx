import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';
import { QueryProvider } from './providers';
import { QueryErrorBoundary } from './components/ui/QueryErrorBoundary';
import { SkipLinks } from './components/accessibility/SkipLinks';
import { LiveRegion } from './components/accessibility/LiveRegion';
import { theme } from './theme';
import { AppRouter } from './AppRouter';
import { initializePerformanceMonitoring } from './utils/performance';
import { preloadCommonLibraries } from './utils/dynamicImports';

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Initialize performance monitoring
initializePerformanceMonitoring();

// Preload commonly used libraries
preloadCommonLibraries();

function App() {
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' },
  ];

  return (
    <QueryProvider>
      <MantineProvider theme={theme}>
        {/* Skip links for keyboard navigation */}
        <SkipLinks links={skipLinks} />

        {/* Live region for screen reader announcements */}
        <LiveRegion />

        <Notifications
          position="top-right"
          // Ensure notifications are announced to screen readers
          styles={{
            notification: {
              '&[data-variant="success"]': {
                'aria-live': 'polite',
              },
              '&[data-variant="error"]': {
                'aria-live': 'assertive',
              },
            },
          }}
        />

        <QueryErrorBoundary>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </QueryErrorBoundary>
      </MantineProvider>
    </QueryProvider>
  );
}

export default App;
