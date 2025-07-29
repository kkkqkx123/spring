// Departments feature public API

// Pages
export { DepartmentsPage } from './pages/DepartmentsPage';

// Components
export { DepartmentTree } from './components/DepartmentTree';
export {
  DepartmentSelect,
  SimpleDepartmentSelect,
} from './components/DepartmentSelect';
export { DepartmentForm } from './components/DepartmentForm';
export { DepartmentDetail } from './components/DepartmentDetail';
export { DepartmentMoveDialog } from './components/DepartmentMoveDialog';

// Hooks
export { useDepartments, useDepartmentTree } from './hooks/useDepartments';
export {
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useMoveDepartment,
  useDepartmentEmployees,
} from './hooks/useDepartmentTree';

// Services
export { DepartmentApi } from './services/departmentApi';
export type {
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DepartmentMoveRequest,
} from './services/departmentApi';
