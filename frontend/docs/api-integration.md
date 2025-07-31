# API Integration Documentation

This document provides comprehensive information about the frontend-backend API integration for the Employee Management System.

## Overview

The frontend React application integrates with a Spring Boot backend through RESTful APIs and WebSocket connections. All API services are centralized in the `src/services/` directory and use a common API client with built-in authentication, error handling, and request/response interceptors.

## Architecture

### API Client (`src/services/api.ts`)

The core API client provides:
- Automatic JWT token attachment
- Token refresh handling
- Global error handling
- Request/response interceptors
- File upload/download capabilities
- Health check functionality

### Service Layer

Each backend controller has a corresponding frontend API service:

- `authApi.ts` - Authentication and user management
- `employeeApi.ts` - Employee CRUD operations
- `departmentApi.ts` - Department management
- `positionApi.ts` - Position management
- `chatApi.ts` - Real-time messaging
- `emailApi.ts` - Email sending and templates
- `notificationApi.ts` - System notifications
- `permissionApi.ts` - Role and permission management
- `payrollApi.ts` - Payroll processing

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Authenticate user and get JWT token |
| POST | `/register` | Register new user account |
| POST | `/logout` | Logout current user |
| POST | `/refresh` | Refresh JWT token |

### Employee Management (`/api/employees`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get paginated list of employees |
| GET | `/{id}` | Get employee by ID |
| POST | `/` | Create new employee |
| PUT | `/{id}` | Update existing employee |
| DELETE | `/{id}` | Delete employee |
| DELETE | `/` | Delete multiple employees |
| POST | `/search` | Search employees with criteria |
| POST | `/import` | Import employees from Excel |
| POST | `/export` | Export employees to Excel |
| GET | `/import-template` | Download import template |

### Department Management (`/api/departments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all departments |
| GET | `/{id}` | Get department by ID |
| POST | `/` | Create new department |
| PUT | `/{id}` | Update department |
| DELETE | `/{id}` | Delete department |
| GET | `/tree` | Get department hierarchy tree |
| GET | `/parent/{parentId}` | Get child departments |
| PUT | `/{id}/move/{newParentId}` | Move department to new parent |
| GET | `/by-name` | Get department by name |

### Position Management (`/api/positions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all positions |
| GET | `/{id}` | Get position by ID |
| POST | `/` | Create new position |
| PUT | `/{id}` | Update position |
| DELETE | `/{id}` | Delete position |
| GET | `/department/{departmentId}` | Get positions by department |
| GET | `/search` | Search positions |
| GET | `/{id}/has-employees` | Check if position has employees |

### Chat System (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send message via REST |
| GET | `/conversation/{userId}` | Get conversation with user |
| GET | `/conversations` | Get recent conversations |
| PUT | `/conversation/{userId}/read` | Mark conversation as read |
| GET | `/unread/count` | Get unread message count |
| GET | `/messages` | Get all messages (paginated) |
| POST | `/messages` | Create new message |
| GET | `/messages/{id}` | Get message by ID |
| PUT | `/messages/{id}` | Update message |
| DELETE | `/messages/{id}` | Delete message |
| GET | `/messages/recent` | Get recent messages |
| GET | `/messages/search` | Search messages |
| GET | `/messages/date-range` | Get messages by date range |

### Email System (`/api/email`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send single email |
| POST | `/send-bulk` | Send bulk emails |
| POST | `/send-to-employee/{employeeId}` | Send email to employee |
| POST | `/send-to-department/{departmentId}` | Send email to department |
| GET | `/templates` | Get available templates |
| POST | `/templates/{templateName}/preview` | Preview template |

### Notification System (`/api/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get user notifications |
| GET | `/count` | Get unread notification count |
| PUT | `/{id}/read` | Mark notification as read |
| PUT | `/read` | Mark multiple as read |
| PUT | `/read-all` | Mark all as read |
| DELETE | `/{id}` | Delete notification |
| POST | `/user` | Create user notification |
| POST | `/users` | Create multi-user notification |
| POST | `/role` | Create role notification |
| POST | `/broadcast` | Broadcast to all users |

### Permission Management (`/api/permissions`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | Get all roles |
| GET | `/roles/{id}` | Get role by ID |
| POST | `/roles` | Create new role |
| PUT | `/roles/{id}` | Update role |
| DELETE | `/roles/{id}` | Delete role |
| GET | `/resources` | Get all resources |
| POST | `/resources` | Create new resource |
| POST | `/users/{userId}/roles/{roleId}` | Assign role to user |
| DELETE | `/users/{userId}/roles/{roleId}` | Remove role from user |
| GET | `/users/{userId}/roles` | Get user roles |
| POST | `/roles/{roleName}/resources/{resourceId}` | Assign resource to role |
| DELETE | `/roles/{roleId}/resources/{resourceId}` | Remove resource from role |
| GET | `/roles/{roleId}/resources` | Get role resources |
| GET | `/users/{userId}/check` | Check user permission |

### Payroll Management (`/api/payroll`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get paginated payroll ledgers |
| GET | `/{id}` | Get payroll ledger by ID |
| POST | `/` | Create payroll ledger |
| PUT | `/{id}` | Update payroll ledger |
| DELETE | `/{id}` | Delete payroll ledger |
| POST | `/search` | Search payroll ledgers |
| GET | `/employee/{employeeId}` | Get employee payroll |
| GET | `/period/{year}/{month}` | Get payroll by period |
| GET | `/department/{departmentId}` | Get department payroll |
| POST | `/calculate` | Calculate payroll |
| POST | `/validate` | Validate calculations |
| PUT | `/{id}/status` | Update payroll status |
| PUT | `/{id}/payment` | Process payment |
| GET | `/stats/department/{year}/{month}` | Department statistics |
| GET | `/stats/status/{year}/{month}` | Status statistics |
| GET | `/total/{year}/{month}` | Total payroll amount |
| POST | `/generate/{year}/{month}` | Generate payroll ledgers |

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format

```json
{
  "status": 400,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### Frontend Error Handling

The API client automatically handles:
- Network errors
- Authentication errors (401)
- Token refresh
- Global error notifications

## Authentication

### JWT Token Flow

1. User logs in with credentials
2. Backend returns JWT token
3. Token stored in localStorage
4. Token automatically attached to all requests
5. Token refreshed when expired
6. User redirected to login on authentication failure

### Token Storage

```typescript
// Token is automatically managed by the API client
const token = apiClient.getAuthToken();
apiClient.setAuthToken(newToken);
apiClient.clearAuthToken();
```

## WebSocket Integration

### Connection Management

```typescript
import { webSocketService } from '../services/websocket';

// Connect to WebSocket
await webSocketService.connect();

// Subscribe to events
webSocketService.subscribe('chat:new-message', handleNewMessage);

// Send message
webSocketService.emit('chat:send', messageData);

// Disconnect
webSocketService.disconnect();
```

### Real-time Events

- `chat:new-message` - New chat message received
- `notification:new` - New notification received
- `user:online` - User came online
- `user:offline` - User went offline

## TanStack Query Integration

### Query Keys

All API calls use standardized query keys for caching:

```typescript
import { queryKeys } from '../services/queryKeys';

// Employee queries
queryKeys.employees.all
queryKeys.employees.detail(id)
queryKeys.employees.search(criteria)

// Department queries
queryKeys.departments.tree
queryKeys.departments.detail(id)

// Chat queries
queryKeys.chat.conversation(userId)
queryKeys.chat.unreadCount
```

### Usage Examples

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { employeeApi, queryKeys } from '../services';

// Fetch employees
const { data: employees, isLoading } = useQuery({
  queryKey: queryKeys.employees.list({ page: 0, size: 10 }),
  queryFn: () => employeeApi.getAll({ page: 0, size: 10 }),
});

// Create employee
const createEmployeeMutation = useMutation({
  mutationFn: employeeApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
  },
});
```

## File Upload/Download

### File Upload

```typescript
// Upload employee import file
const file = new File(['data'], 'employees.xlsx');
const result = await employeeApi.import(file);

// Using API client directly
const uploadResult = await apiClient.uploadFile(
  '/api/employees/import',
  file,
  (progress) => console.log(`Upload progress: ${progress}%`)
);
```

### File Download

```typescript
// Download employee export
const exportData = await employeeApi.export({
  format: 'xlsx',
  fields: ['name', 'email', 'department'],
});

// Using API client directly
await apiClient.downloadFile('/api/employees/export', 'employees.xlsx');
```

## Environment Configuration

### API Base URL

```typescript
// .env files
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

// constants.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
```

## Testing

### Integration Tests

```typescript
import { authApi } from '../services';

describe('Auth API Integration', () => {
  it('should login successfully', async () => {
    const result = await authApi.login({
      username: 'testuser',
      password: 'password123',
    });
    
    expect(result.token).toBeDefined();
    expect(result.username).toBe('testuser');
  });
});
```

### Mocking APIs

```typescript
import { vi } from 'vitest';
import { apiClient } from '../services/api';

vi.mock('../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);
mockApiClient.get.mockResolvedValue(mockData);
```

## Performance Considerations

### Caching Strategy

- Use TanStack Query for server state caching
- Implement proper cache invalidation
- Use optimistic updates for better UX

### Request Optimization

- Implement request deduplication
- Use pagination for large datasets
- Implement infinite queries for long lists

### Error Recovery

- Automatic retry for failed requests
- Exponential backoff for retries
- Graceful degradation for offline scenarios

## Security

### CORS Configuration

Backend must be configured to allow frontend origin:

```java
@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' ws://localhost:8080 http://localhost:8080;">
```

### Token Security

- Tokens stored in localStorage (consider httpOnly cookies for production)
- Automatic token refresh
- Secure token transmission over HTTPS

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS configuration includes frontend URL
2. **401 Unauthorized**: Check token validity and refresh logic
3. **Network Errors**: Verify backend is running and accessible
4. **WebSocket Connection Failed**: Check WebSocket URL and backend configuration

### Debug Tools

```typescript
// Enable API client debugging
apiClient.interceptors.request.use(request => {
  console.log('API Request:', request);
  return request;
});

// Check WebSocket connection
webSocketService.on('connect', () => console.log('WebSocket connected'));
webSocketService.on('disconnect', () => console.log('WebSocket disconnected'));
```

This documentation provides a comprehensive guide for understanding and working with the API integration between the React frontend and Spring Boot backend.