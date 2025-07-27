// Query keys factory for TanStack Query
export const queryKeys = {
  // Authentication
  auth: {
    user: ['auth', 'user'] as const,
    permissions: ['auth', 'permissions'] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    list: (params: any) => ['employees', 'list', params] as const,
    detail: (id: number) => ['employees', 'detail', id] as const,
    search: (criteria: any) => ['employees', 'search', criteria] as const,
  },

  // Departments
  departments: {
    all: ['departments'] as const,
    tree: ['departments', 'tree'] as const,
    list: (params: any) => ['departments', 'list', params] as const,
    detail: (id: number) => ['departments', 'detail', id] as const,
  },

  // Positions
  positions: {
    all: ['positions'] as const,
    byDepartment: (departmentId: number) =>
      ['positions', 'department', departmentId] as const,
    detail: (id: number) => ['positions', 'detail', id] as const,
  },

  // Chat
  chat: {
    conversations: ['chat', 'conversations'] as const,
    conversation: (userId: number) => ['chat', 'conversation', userId] as const,
    messages: (userId: number, params: any) =>
      ['chat', 'messages', userId, params] as const,
    unreadCount: ['chat', 'unreadCount'] as const,
  },

  // Email
  email: {
    templates: ['email', 'templates'] as const,
    template: (id: number) => ['email', 'template', id] as const,
    history: (params: any) => ['email', 'history', params] as const,
  },

  // Notifications
  notifications: {
    list: (params: any) => ['notifications', 'list', params] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },

  // Permissions
  permissions: {
    roles: ['permissions', 'roles'] as const,
    role: (id: number) => ['permissions', 'role', id] as const,
    userRoles: (userId: number) =>
      ['permissions', 'userRoles', userId] as const,
  },
} as const;
