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

## UI Component Library and Templates

### Component Hierarchy and Organization

The frontend requires a comprehensive set of templates and UI components organized in a hierarchical structure:

#### Core Layout Components
- **AppShell**: Main application wrapper with responsive navigation
- **Navigation**: Role-based menu with hierarchical structure
- **Header**: Top bar with search, notifications, and user menu
- **PageContainer**: Standard page wrapper with consistent spacing

#### Feature-Specific Templates
- **Authentication**: Login/register forms with validation
- **Employee Management**: List views, forms, import/export interfaces
- **Department Management**: Tree structure, CRUD forms
- **Chat System**: Real-time messaging interface with conversation management
- **Email Management**: Composition interface with template selection
- **Notification System**: Real-time notification center
- **Permission Management**: Role-permission matrix interface

#### Common UI Components
- **DataTable**: Sortable, filterable table with pagination
- **FormField**: Standardized form field wrapper with validation
- **FileUpload**: Drag-and-drop file upload with progress
- **LoadingSpinner**: Multi-size loading indicators
- **Modal/Dialog**: Accessible modal system
- **SearchBar**: Global search with auto-complete

### Design System Requirements

#### Typography Scale
```typescript
const typography = {
  headings: {
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }
  },
  body: {
    large: { fontSize: '1.125rem', lineHeight: 1.6 },
    normal: { fontSize: '1rem', lineHeight: 1.5 },
    small: { fontSize: '0.875rem', lineHeight: 1.4 }
  }
};
```

#### Color System
```typescript
const colors = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827'
  }
};
```

#### Spacing System
```typescript
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem'    // 64px
};
```

### Component Implementation Standards

#### Component Structure Template
```typescript
interface ComponentProps {
  // Props interface with clear documentation
  children?: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Component: FC<ComponentProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}) => {
  // Component logic with proper hooks usage
  const classes = clsx(
    'base-classes',
    `variant-${variant}`,
    `size-${size}`,
    { 'disabled': disabled },
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Export with proper TypeScript types
Component.displayName = 'Component';
export type { ComponentProps };
```

#### Accessibility Standards
```typescript
// Example: Accessible button component
const AccessibleButton: FC<ButtonProps> = ({
  children,
  onClick,
  disabled,
  ariaLabel,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={clsx(
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Implementation Priority

#### Phase 1: Foundation (Weeks 1-2)
1. Core layout components (AppShell, Navigation, Header)
2. Authentication templates (Login, Register forms)
3. Basic UI components (DataTable, FormField, LoadingSpinner)
4. Theme system and design tokens

#### Phase 2: Core Features (Weeks 3-6)
1. Employee management templates (List, Form, Detail views)
2. Department management components (Tree, Forms)
3. Chat system interface (Conversations, Messages)
4. Notification system components

#### Phase 3: Advanced Features (Weeks 7-8)
1. Email management interface (Composer, Templates)
2. Permission management components (Role matrix)
3. File upload and import/export functionality
4. Advanced search and filtering

#### Phase 4: Polish (Weeks 9-10)
1. Mobile-responsive components
2. Accessibility enhancements
3. Performance optimizations
4. Comprehensive testing coverage

### Storybook Integration

Each component should include Storybook stories for:
- Default state
- All variants and sizes
- Interactive states (hover, focus, disabled)
- Error states and edge cases
- Accessibility testing scenarios

```typescript
// Example Storybook story
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.'
      }
    }
  }
} as Meta<typeof Button>;

export const Default: Story<ButtonProps> = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md'
  }
};

export const AllVariants: Story<ButtonProps> = {
  render: () => (
    <div className="space-x-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  )
};
```

This comprehensive frontend guideline ensures scalable, maintainable, and high-quality React application development that aligns with modern best practices and the specific needs of the employee management system.