# API 集成模式文档

## 概述

本文档详细说明了用于连接React前端与Spring Boot后端的API集成模式。后端提供了RESTful API用于数据操作，并提供了基于STOMP协议的WebSocket端点用于实时通信。

## 后端API结构

### 可用控制器

根据后端代码和API文档，系统提供以下控制器：

- **AuthController** (`/api/auth`) - 认证和用户管理
- **EmployeeController** (`/api/employees`) - 员工CRUD操作
- **DepartmentController** (`/api/departments`) - 部门管理
- **PositionController** (`/api/positions`) - 职位管理
- **ChatController** (`/api/chat`) - 实时聊天
- **NotificationController** (`/api/notifications`) - 系统通知
- **EmailController** (`/api/email`) - 邮件服务
- **PayrollController** (`/api/payroll`) - 薪资管理
- **PermissionController** (`/api/permissions`) - 角色与权限管理

## API客户端架构

### 基础API客户端

使用`axios`创建一个可复用的、带有拦截器的API客户端是最佳实践。

```typescript
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
    // 请求拦截器：自动附加认证令牌
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

    // 响应拦截器：处理全局错误，如401未授权
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // 处理令牌刷新或重定向到登录页面
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleUnauthorized() {
    // 实际应用中可能会尝试刷新令牌
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }

  // 提供 get, post, put, delete 等方法
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T>(url, config).then(res => res.data);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T>(url, data, config).then(res => res.data);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<T>(url, data, config).then(res => res.data);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T>(url, config).then(res => res.data);
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL);
```

## 功能模块API服务

下面是根据OpenAPI文档为每个模块定义的TypeScript接口和API服务类。

### 通用类型定义

```typescript
// types/common.ts
export interface Pageable {
  page: number;
  size: number;
  sort?: string; // e.g., "name,asc"
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
```

### 认证 (Auth)

```typescript
// features/auth/types.ts
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
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// services/authApi.ts
import { apiClient } from '../api';

export const authApi = {
  login: (credentials: LoginRequest) => apiClient.post<AuthResponse>('/api/auth/login', credentials),
  register: (userData: RegisterRequest) => apiClient.post<UserDto>('/api/auth/register', userData),
  logout: () => apiClient.post('/api/auth/logout'),
  refreshToken: () => apiClient.post<AuthResponse>('/api/auth/refresh'),
};
```

### 员工 (Employee)

```typescript
// features/employees/types.ts
export interface Employee {
  id: number;
  employeeNumber: string;
  name: string;
  email: string;
  phone?: string;
  department: Department;
  position: Position;
  hireDate: string; // format: date
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string; // format: date
  address?: string;
  salary?: number;
  // ... other fields
}

export interface EmployeeSearchCriteria {
  name?: string;
  email?: string;
  departmentId?: number;
  positionId?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  // ... other search fields
}

// services/employeeApi.ts
import { apiClient } from '../api';

export const employeeApi = {
  getAll: (params: Pageable) => apiClient.get<PaginatedResponse<Employee>>('/api/employees', { params }),
  getById: (id: number) => apiClient.get<Employee>(`/api/employees/${id}`),
  create: (employee: Omit<Employee, 'id'>) => apiClient.post<Employee>('/api/employees', employee),
  update: (id: number, employee: Employee) => apiClient.put<Employee>(`/api/employees/${id}`, employee),
  delete: (id: number) => apiClient.delete(`/api/employees/${id}`),
  deleteMultiple: (ids: number[]) => apiClient.delete<number>('/api/employees', { data: ids }),
  search: (criteria: EmployeeSearchCriteria) => apiClient.post<PaginatedResponse<Employee>>('/api/employees/search', criteria),
  // ... import/export methods
};
```

### 部门 (Department)

```typescript
// features/departments/types.ts
export interface DepartmentDto {
  id: number;
  name: string;
  parentId?: number;
  parentName?: string;
  children?: DepartmentDto[];
  // ... other fields
}

// services/departmentApi.ts
import { apiClient } from '../api';

export const departmentApi = {
  getAll: () => apiClient.get<DepartmentDto[]>('/api/departments'),
  getTree: () => apiClient.get<DepartmentDto[]>('/api/departments/tree'),
  getById: (id: number) => apiClient.get<DepartmentDto>(`/api/departments/${id}`),
  create: (department: Omit<DepartmentDto, 'id'>) => apiClient.post<DepartmentDto>('/api/departments', department),
  update: (id: number, department: DepartmentDto) => apiClient.put<DepartmentDto>(`/api/departments/${id}`, department),
  delete: (id: number) => apiClient.delete(`/api/departments/${id}`),
  // ... other methods
};
```

(... 其他API模块，如Position, Payroll, Email等，都遵循类似的模式进行定义)

## TanStack Query 集成

通过为每个API资源创建类型安全的查询键，可以高效地管理缓存和数据状态。

```typescript
// services/queryKeys.ts
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (params: any) => ['employees', 'list', params] as const,
    detail: (id: number) => ['employees', 'detail', id] as const,
  },
  departments: {
