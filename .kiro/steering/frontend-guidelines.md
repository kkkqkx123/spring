# Frontend Development Guidelines

## Development Approach

### Vertical Slice Development
- Implement complete features end-to-end (frontend + corresponding backend API) in each iteration
- Prioritize working software over comprehensive documentation
- Focus on user-facing functionality that delivers immediate value

### Component-Driven Development
- Use Storybook for component library documentation and development
- Build reusable UI components before feature-specific components
- Maintain a design system with consistent styling and behavior

## Architecture Patterns

### Feature-Based Organization
```
src/features/[feature-name]/
├── components/          # Feature-specific components
├── hooks/              # Feature-specific custom hooks
├── services/           # Feature-specific API services
├── types/              # Feature-specific type definitions
├── utils/              # Feature-specific utilities
└── index.ts            # Feature public API
```

### State Management Strategy
- **Global State (Zustand)**: Authentication, UI preferences, notifications
- **Server State (TanStack Query)**: API data with caching and synchronization
- **Local State (useState/useReducer)**: Component-specific state
- **Form State (React Hook Form)**: Form data and validation

### Real-time System Architecture
Use an **Event Bus Pattern** for managing real-time events:
```typescript
// Central event bus for WebSocket events
class EventBus {
  private listeners: Map<string, Function[]> = new Map();
  
  subscribe(event: string, callback: Function) { /* ... */ }
  emit(event: string, data: any) { /* ... */ }
  unsubscribe(event: string, callback: Function) { /* ... */ }
}

// Usage in components
const { subscribe, unsubscribe } = useEventBus();
useEffect(() => {
  const handleNewMessage = (message) => { /* ... */ };
  subscribe('chat:new-message', handleNewMessage);
  return () => unsubscribe('chat:new-message', handleNewMessage);
}, []);
```

## Performance Optimization

### Code Splitting Strategy
1. **Route-based splitting**: Lazy load feature modules
2. **Component-based splitting**: Dynamic imports for heavy components
3. **Library splitting**: Separate vendor bundles for better caching

### Rendering Optimization
- Use `React.memo` for expensive components
- Implement `useMemo` and `useCallback` for expensive computations
- Use Zustand selectors to prevent unnecessary re-renders
- Implement virtual scrolling for large lists (employee lists, chat history)

### Bundle Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mantine/core', '@mantine/hooks'],
          utils: ['axios', 'socket.io-client']
        }
      }
    }
  }
});
```

## Testing Strategy

### Testing Pyramid
1. **Unit Tests (70%)**: Components, hooks, utilities
2. **Integration Tests (20%)**: Feature workflows, API integration
3. **E2E Tests (10%)**: Critical user paths

### Testing Tools and Patterns
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { EmployeeForm } from './EmployeeForm';

test('should validate required fields', async () => {
  render(<EmployeeForm onSubmit={jest.fn()} />);
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
});

// Hook testing
import { renderHook, act } from '@testing-library/react';
import { useEmployeeForm } from './useEmployeeForm';

test('should handle form submission', async () => {
  const { result } = renderHook(() => useEmployeeForm());
  
  act(() => {
    result.current.handleSubmit({ firstName: 'John', lastName: 'Doe' });
  });
  
  expect(result.current.isSubmitting).toBe(true);
});
```

### Visual Regression Testing
- Use Storybook + Chromatic for visual regression testing
- Maintain component stories for all UI components
- Automate visual testing in CI/CD pipeline

## Security Implementation

### Authentication & Authorization
```typescript
// Permission-based component rendering
const ProtectedComponent = ({ requiredPermission, children }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(requiredPermission)) {
    return <AccessDenied />;
  }
  
  return children;
};

// Route protection
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <AccessDenied />;
  }
  
  return children;
};
```

### Input Sanitization
```typescript
import DOMPurify from 'dompurify';

// Sanitize user inputs
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};

// Use in forms
const handleSubmit = (data) => {
  const sanitizedData = {
    ...data,
    content: sanitizeInput(data.content)
  };
  // Submit sanitized data
};
```

## Accessibility Implementation

### WCAG 2.1 Compliance
```typescript
// Proper ARIA labels and descriptions
<button
  aria-label="Delete employee John Doe"
  aria-describedby="delete-help-text"
  onClick={() => handleDelete(employee.id)}
>
  <DeleteIcon />
</button>
<div id="delete-help-text" className="sr-only">
  This action cannot be undone
</div>

// Keyboard navigation
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          onSelect(items[selectedIndex]);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);
  
  return selectedIndex;
};
```

## Error Handling Patterns

### Error Boundaries
```typescript
class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Feature error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <FeatureErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### API Error Handling
```typescript
// Centralized error handling with TanStack Query
const useApiError = () => {
  return useMutation({
    onError: (error: ApiError) => {
      switch (error.status) {
        case 401:
          // Redirect to login
          break;
        case 403:
          // Show access denied
          break;
        case 500:
          // Show generic error
          break;
        default:
          // Show specific error message
      }
    }
  });
};
```

## Real-time Features Implementation

### WebSocket Connection Management
```typescript
class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect() {
    this.socket = io(WS_URL, {
      transports: ['websocket'],
      upgrade: false
    });
    
    this.socket.on('connect', this.handleConnect);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('reconnect_attempt', this.handleReconnectAttempt);
  }
  
  private handleConnect = () => {
    this.reconnectAttempts = 0;
    // Emit authentication
    this.socket?.emit('authenticate', { token: getAuthToken() });
  };
  
  private handleDisconnect = () => {
    // Show connection lost notification
    showNotification('Connection lost. Attempting to reconnect...', 'warning');
  };
  
  private handleReconnectAttempt = () => {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      showNotification('Unable to connect. Please refresh the page.', 'error');
    }
  };
}
```

## Development Workflow

### Git Workflow
1. **Feature branches**: `feature/employee-management`
2. **Commit messages**: Follow conventional commits
3. **Pull requests**: Include tests and documentation
4. **Code review**: Focus on functionality, performance, and accessibility

### Quality Gates
- **TypeScript**: No type errors allowed
- **ESLint**: No linting errors
- **Tests**: Minimum 80% code coverage
- **Accessibility**: No accessibility violations
- **Performance**: Bundle size within limits

### Continuous Integration
```yaml
# .github/workflows/frontend.yml
name: Frontend CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build
      - run: npm run test:e2e
```

## Monitoring and Analytics

### Performance Monitoring
```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to monitoring service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Error Tracking
```typescript
// Error boundary with error reporting
const reportError = (error: Error, errorInfo: ErrorInfo) => {
  // Send to error tracking service (e.g., Sentry)
  console.error('Application error:', error, errorInfo);
};
```

This comprehensive frontend guideline ensures scalable, maintainable, and high-quality React application development that aligns with modern best practices and the specific needs of the employee management system.