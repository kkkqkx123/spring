// Export all API services
export { authApi } from './authApi';
export { employeeApi } from './employeeApi';
export { departmentApi } from './departmentApi';
export { positionApi } from './positionApi';
export { chatApi } from './chatApi';
export { emailApi } from './emailApi';
export { notificationApi } from './notificationApi';
export { permissionApi } from './permissionApi';
export { payrollApi } from './payrollApi';

// Export core API client and utilities
export { apiClient } from './api';
export { authService } from './auth';
export { webSocketService } from './websocket';
export { queryClient } from './queryClient';
export { queryKeys } from './queryKeys';

// Export types
export type {
  EmailRequest,
  EmailTemplate,
  EmailPreview,
} from './emailApi';

export type {
  NotificationResponse,
  NotificationRequest,
  NotificationParams,
} from './notificationApi';

export type {
  PermissionCheckResponse,
} from './permissionApi';

export type {
  PayrollLedgerDTO,
  PayrollStatus,
  PayrollSearchCriteria,
  PayrollStatistics,
} from './payrollApi';

export type {
  ConversationParams,
  MessageSearchParams,
  DateRangeParams,
} from './chatApi';

export type {
  EmployeeImportResult,
  EmployeeExportOptions,
  EmployeeStatistics,
} from './employeeApi';