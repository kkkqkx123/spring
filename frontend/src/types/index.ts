// Common types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
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

export interface Pageable {
  page: number;
  size: number;
  sort?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// User and Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  department?: Department;
  roles: Role[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Resource {
  id: number;
  name: string;
  description?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// Employee types
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

export interface Department {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  children?: Department[];
  employeeCount: number;
  createdAt: string;
}

export interface DepartmentDto {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parentName?: string;
  children?: DepartmentDto[];
}

export interface Position {
  id: number;
  title: string;
  description?: string;
  departmentId: number;
}

export interface PositionDto {
  id: number;
  title: string;
  description?: string;
  departmentId: number;
  departmentName?: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface EmployeeSearchCriteria {
  name?: string;
  email?: string;
  departmentId?: number;
  positionId?: number;
  status?: EmployeeStatus;
  hireDate?: {
    from?: string;
    to?: string;
  };
}

// Chat types
export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  createdAt: string;
  read: boolean;
}

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
  isRead: boolean;
}

export interface Conversation {
  userId: number;
  userName: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

// Notification types
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  userId: number;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Email types
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRequest {
  templateId: number;
  recipients: number[];
  variables: Record<string, string>;
  subject?: string;
  customContent?: string;
}

export interface EmailRecipient {
  id: number;
  name: string;
  email: string;
  type: 'individual' | 'department';
}

export interface EmailComposition {
  templateId?: number;
  recipients: EmailRecipient[];
  subject: string;
  content: string;
  variables: Record<string, string>;
  scheduledAt?: string;
}

export interface EmailHistory {
  id: number;
  subject: string;
  recipientCount: number;
  status: EmailStatus;
  sentAt: string;
  templateName?: string;
  errorMessage?: string;
}

export type EmailStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

// Form types
export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// UI Component types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
}

export interface DataTableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: T[keyof T], record: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  };
}
