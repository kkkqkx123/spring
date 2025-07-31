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
    statistics: ['employees', 'statistics'] as const,
  },

  // Departments
  departments: {
    all: ['departments'] as const,
    tree: ['departments', 'tree'] as const,
    list: (params: Record<string, unknown>) =>
      ['departments', 'list', params] as const,
    detail: (id: number) => ['departments', 'detail', id] as const,
    children: (parentId: number) =>
      ['departments', 'children', parentId] as const,
    byName: (name: string) => ['departments', 'byName', name] as const,
  },

  // Positions
  positions: {
    all: ['positions'] as const,
    byDepartment: (departmentId: number) =>
      ['positions', 'department', departmentId] as const,
    detail: (id: number) => ['positions', 'detail', id] as const,
    search: (searchTerm?: string) =>
      ['positions', 'search', searchTerm] as const,
    hasEmployees: (id: number) => ['positions', 'hasEmployees', id] as const,
  },

  // Chat
  chat: {
    conversations: ['chat', 'conversations'] as const,
    conversation: (userId: number, params?: Record<string, unknown>) =>
      params
        ? (['chat', 'conversation', userId, params] as const)
        : (['chat', 'conversation', userId] as const),
    messages: (params: Record<string, unknown>) =>
      ['chat', 'messages', params] as const,
    message: (id: number) => ['chat', 'message', id] as const,
    unreadCount: ['chat', 'unreadCount'] as const,
    search: (query: string, params: Record<string, unknown>) =>
      ['chat', 'search', query, params] as const,
    recent: (limit: number) => ['chat', 'recent', limit] as const,
    dateRange: (
      startDate: string,
      endDate: string,
      params: Record<string, unknown>
    ) => ['chat', 'dateRange', startDate, endDate, params] as const,
  },

  // Email
  email: {
    templates: ['email', 'templates'] as const,
    preview: (templateName: string, variables: Record<string, unknown>) =>
      ['email', 'preview', templateName, variables] as const,
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
    resources: ['permissions', 'resources'] as const,
    roleResources: (roleId: number) =>
      ['permissions', 'roleResources', roleId] as const,
    userPermissionCheck: (userId: number, resource: string) =>
      ['permissions', 'userCheck', userId, resource] as const,
  },

  // Payroll
  payroll: {
    all: ['payroll'] as const,
    list: (params: Record<string, unknown>) =>
      ['payroll', 'list', params] as const,
    detail: (id: number) => ['payroll', 'detail', id] as const,
    search: (
      criteria: Record<string, unknown>,
      params: Record<string, unknown>
    ) => ['payroll', 'search', criteria, params] as const,
    byEmployee: (employeeId: number, params: Record<string, unknown>) =>
      ['payroll', 'employee', employeeId, params] as const,
    byPayPeriod: (
      year: number,
      month: number,
      params: Record<string, unknown>
    ) => ['payroll', 'payPeriod', year, month, params] as const,
    byDepartment: (departmentId: number, params: Record<string, unknown>) =>
      ['payroll', 'department', departmentId, params] as const,
    statsByDepartment: (year: number, month: number) =>
      ['payroll', 'stats', 'department', year, month] as const,
    statsByStatus: (year: number, month: number) =>
      ['payroll', 'stats', 'status', year, month] as const,
    totalAmount: (year: number, month: number) =>
      ['payroll', 'total', year, month] as const,
    totalAmountByDepartment: (
      departmentId: number,
      year: number,
      month: number
    ) => ['payroll', 'total', 'department', departmentId, year, month] as const,
  },
} as const;
