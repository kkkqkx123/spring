// Employees feature public API

// Components
export { EmployeeList } from './components/EmployeeList';
export { EmployeeSearch } from './components/EmployeeSearch';
export { EmployeeCard } from './components/EmployeeCard';
export { EmployeeForm } from './components/EmployeeForm';
export { EmployeeDetail } from './components/EmployeeDetail';

// Pages
export { EmployeePage } from './pages/EmployeePage';

// Hooks
export {
  useEmployees,
  useEmployee,
  useEmployeeSearch,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useDeleteEmployees,
  useEmployeeImport,
  useEmployeeExport,
  useUploadProfilePicture,
  useEmployeeListState,
} from './hooks/useEmployees';

// Services
export { employeeApi } from './services/employeeApi';

// Types
export type {
  EmployeeSearchCriteria,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
} from './services/employeeApi';
