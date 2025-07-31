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
    list: (params: Record<string, unknown>) =>
      ['employees', 'list', params] as const,
    detail: (id: number) => ['employees', 'detail', id] as const,
    search: (criteria: Record<string, unknown>) =>
      ['employees', 'search', criteria] as const,
  },

  // Departments
  departments: {
    all: ['departments'] as const,
    tree: ['departments', 'tree'] as const,
    list: (params: Record<string, unknown>) =>
      ['departments', 'list', params] as const,
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
    conversation: (userId: number, params?: Record<string, unknown>) =>
      params
        ? (['chat', 'conversation', userId, params] as const)
        : (['chat', 'conversation', userId] as const),
    messages: (userId: number, params: Record<string, unknown>) =>
      ['chat', 'messages', userId, params] as const,
    unreadCount: ['chat', 'unreadCount'] as const,
    search: (query: string, params: Record<string, unknown>) =>
      ['chat', 'search', query, params] as const,
    onlineUsers: ['chat', 'onlineUsers'] as const,
  },

  // Email
  email: {
    templates: ['email', 'templates'] as const,
    template: (id: number) => ['email', 'template', id] as const,
    history: (params: Record<string, unknown>) =>
      ['email', 'history', params] as const,
    recipients: ['email', 'recipients'] as const,
    departmentRecipients: (departmentId: number) =>
      ['email', 'recipients', 'department', departmentId] as const,
    preview: (templateId: number, variables: Record<string, string>) =>
      ['email', 'preview', templateId, variables] as const,
    bulkProgress: (jobId: string) => ['email', 'bulk-progress', jobId] as const,
  },

  // Notifications
  notifications: {
    list: (params: Record<string, unknown>) =>
      ['notifications', 'list', params] as const,
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
