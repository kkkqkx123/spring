import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';
import { QueryProvider } from './providers';
import { QueryErrorBoundary } from './components/ui/QueryErrorBoundary';
import { theme } from './theme';
import { AppRouter } from './AppRouter';

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

function App() {
  return (
    <QueryProvider>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
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
