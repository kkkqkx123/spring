# API Integration Patterns
## Overview
This document outlines the API integration patterns for connecting the React frontend with the Spring Boot backend. The backend provides RESTful APIs and WebSocket endpoints for real-time features.

## Backend API Structure
Available Controllers
Based on the backend code, we have the following controllers:

AuthController (/api/auth) - Authentication and user management
EmployeeController (/api/employees) - Employee CRUD operations
DepartmentController (/api/departments) - Department management
ChatController (/api/chat) - Real-time messaging
EmailController (/api/email) - Email management
NotificationController (/api/notifications) - Notification system
PayrollController (/api/payroll) - Payroll management
PermissionController (/api/permissions) - Role and permission management
PositionController (/api/positions) - Position management
API Client Architecture
Base API Client
// services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }
  
  private async handleUnauthorized() {
    // Try to refresh token or redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}
Feature-Specific API Services
Authentication API
// features/auth/services/authApi.ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export class AuthApi {
  constructor(private client: ApiClient) {}
  
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post('/api/auth/login', credentials);
    return response.data;
  }
  
  async register(userData: RegisterRequest): Promise<UserDto> {
    const response = await this.client.post('/api/auth/register', userData);
    return response.data;
  }
  
  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }
  
  async refreshToken(): Promise<AuthResponse> {
    const response = await this.client.post('/api/auth/refresh');
    return response.data;
  }
}
Employee API
// features/employees/services/employeeApi.ts
export interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: Department;
  position: Position;
  hireDate: string;
  salary?: number;
  status: EmployeeStatus;
  profilePicture?: string;
}

export interface EmployeeSearchCriteria {
  name?: string;
  departmentId?: number;
  positionId?: number;
  status?: EmployeeStatus;
}

export class EmployeeApi {
  constructor(private client: ApiClient) {}
  
  async getEmployees(pageable: Pageable): Promise<PaginatedResponse<Employee>> {
    const response = await this.client.get('/api/employees', { params: pageable });
    return response.data;
  }
  
  async getEmployee(id: number): Promise<Employee> {
    const response = await this.client.get(`/api/employees/${id}`);
    return response.data;
  }
  
  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await this.client.post('/api/employees', employee);
    return response.data;
  }
  
  async updateEmployee(id: number, employee: Employee): Promise<Employee> {
    const response = await this.client.put(`/api/employees/${id}`, employee);
    return response.data;
  }
  
  async deleteEmployee(id: number): Promise<void> {
    await this.client.delete(`/api/employees/${id}`);
  }
  
  async searchEmployees(
    criteria: EmployeeSearchCriteria, 
    pageable: Pageable
  ): Promise<PaginatedResponse<Employee>> {
    const response = await this.client.post('/api/employees/search', criteria, {
      params: pageable
    });
    return response.data;
  }
  
  async importEmployees(file: File): Promise<Employee[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/api/employees/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
  
  async exportEmployees(ids?: number[]): Promise<Blob> {
    const response = await this.client.post('/api/employees/export', ids, {
      responseType: 'blob'
    });
    return response.data;
  }
}
Chat API
// features/chat/services/chatApi.ts
export interface ChatMessageRequest {
  recipientId: number;
  content: string;
}

export interface ChatMessageResponse {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  createdAt: string;
  read: boolean;
}

export class ChatApi {
  constructor(private client: ApiClient) {}
  
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await this.client.post('/api/chat/send', request);
    return response.data;
  }
  
  async getConversation(
    userId: number, 
    pageable: Pageable
  ): Promise<PaginatedResponse<ChatMessageResponse>> {
    const response = await this.client.get(`/api/chat/conversation/${userId}`, {
      params: pageable
    });
    return response.data;
  }
  
  async getRecentConversations(): Promise<User[]> {
    const response = await this.client.get('/api/chat/conversations');
    return response.data;
  }
  
  async markConversationAsRead(userId: number): Promise<number> {
    const response = await this.client.put(`/api/chat/conversation/${userId}/read`);
    return response.data;
  }
  
  async getUnreadCount(): Promise<number> {
    const response = await this.client.get('/api/chat/unread/count');
    return response.data;
  }
}
TanStack Query Integration
Query Keys Factory
// services/queryKeys.ts
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (params: any) => ['employees', 'list', params] as const,
    detail: (id: number) => ['employees', 'detail', id] as const,
    search: (criteria: any) => ['employees', 'search', criteria] as const,
  },
  departments: {
    all: ['departments'] as const,
    tree: ['departments', 'tree'] as const,
    detail: (id: number) => ['departments', 'detail', id] as const,
  },
  chat: {
    conversations: ['chat', 'conversations'] as const,
    conversation: (userId: number) => ['chat', 'conversation', userId] as const,
    unreadCount: ['chat', 'unreadCount'] as const,
  },
} as const;
Custom Hooks with TanStack Query
// features/employees/hooks/useEmployees.ts
export const useEmployees = (pageable: Pageable) => {
  return useQuery({
    queryKey: queryKeys.employees.list(pageable),
    queryFn: () => employeeApi.getEmployees(pageable),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEmployee = (id: number) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeeApi.getEmployee(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, employee }: { id: number; employee: Employee }) =>
      employeeApi.updateEmployee(id, employee),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
};
WebSocket Integration
WebSocket Service
// services/websocket.ts
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket | null = null;
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }
  
  connect(token: string) {
    this.socket = io(process.env.VITE_WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    
    // Chat events
    this.socket.on('chat:new-message', (message: ChatMessageResponse) => {
      this.eventBus.emit('chat:new-message', message);
    });
    
    // Notification events
    this.socket.on('notification:new', (notification: Notification) => {
      this.eventBus.emit('notification:new', notification);
    });
  }
  
  sendChatMessage(message: ChatMessageRequest) {
    this.socket?.emit('chat', message);
  }
  
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
Real-time Hooks
// hooks/useRealTimeChat.ts
export const useRealTimeChat = (currentUserId: number) => {
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe } = useEventBus();
  
  useEffect(() => {
    const handleNewMessage = (message: ChatMessageResponse) => {
      // Update conversation cache
      queryClient.setQueryData(
        queryKeys.chat.conversation(message.senderId),
        (old: PaginatedResponse<ChatMessageResponse> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: [message, ...old.content],
          };
        }
      );
      
      // Update unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount });
    };
    
    subscribe('chat:new-message', handleNewMessage);
    return () => unsubscribe('chat:new-message', handleNewMessage);
  }, [subscribe, unsubscribe, queryClient]);
};
Error Handling Patterns
API Error Types
// types/api.ts
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export class ApiErrorHandler {
  static handle(error: any): ApiError {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        code: error.response.data?.code,
        details: error.response.data?.details,
      };
    }
    
    if (error.request) {
      return {
        status: 0,
        message: 'Network error - please check your connection',
      };
    }
    
    return {
      status: -1,
      message: error.message || 'Unknown error occurred',
    };
  }
}
Global Error Handling
// hooks/useGlobalErrorHandler.ts
export const useGlobalErrorHandler = () => {
  const { showNotification } = useNotifications();
  
  return useCallback((error: ApiError) => {
    switch (error.status) {
      case 401:
        showNotification('Session expired. Please log in again.', 'error');
        // Redirect to login
        break;
      case 403:
        showNotification('You do not have permission to perform this action.', 'error');
        break;
      case 404:
        showNotification('The requested resource was not found.', 'error');
        break;
      case 500:
        showNotification('Server error. Please try again later.', 'error');
        break;
      default:
        showNotification(error.message, 'error');
    }
  }, [showNotification]);
};
File Upload Patterns
File Upload Service
// services/fileUpload.ts
export class FileUploadService {
  constructor(private client: ApiClient) {}
  
  async uploadFile(
    file: File, 
    endpoint: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.client.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
  }
}
Pagination Patterns
Pagination Types
// types/pagination.ts
export interface Pageable {
  page: number;
  size: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
Pagination Hook
// hooks/usePagination.ts
export const usePagination = (initialSize = 10) => {
  const [pageable, setPageable] = useState<Pageable>({
    page: 0,
    size: initialSize,
  });
  
  const setPage = useCallback((page: number) => {
    setPageable(prev => ({ ...prev, page }));
  }, []);
  
  const setSize = useCallback((size: number) => {
    setPageable(prev => ({ ...prev, size, page: 0 }));
  }, []);
  
  const setSort = useCallback((sort: string) => {
    setPageable(prev => ({ ...prev, sort, page: 0 }));
  }, []);
  
  return {
    pageable,
    setPage,
    setSize,
    setSort,
  };
};
This comprehensive API integration pattern ensures type-safe, efficient, and maintainable communication between the React frontend and Spring Boot backend, with proper error handling, real-time features, and performance optimization.

You can copy this content and paste it into the .kiro/steering/api-integration.md file to complete the steering documentation for the project.