import { apiClient } from './api';
import type { PaginatedResponse, Pageable } from '../types';

export interface PayrollLedgerDTO {
  id?: number;
  employeeId: number;
  payPeriod: string; // YearMonth format: "2024-01"
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paymentReference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface PayrollSearchCriteria {
  employeeId?: number;
  departmentId?: number;
  payPeriod?: string;
  status?: PayrollStatus;
  minNetSalary?: number;
  maxNetSalary?: number;
}

export interface PayrollStatistics {
  department: string;
  count: number;
  totalAmount: number;
}

export const payrollApi = {
  // Basic CRUD operations
  getAll: (
    params: Pageable = { page: 0, size: 10 }
  ): Promise<PaginatedResponse<PayrollLedgerDTO>> => {
    return apiClient.get('/api/payroll', { params });
  },

  getById: (id: number): Promise<PayrollLedgerDTO> => {
    return apiClient.get(`/api/payroll/${id}`);
  },

  create: (
    payrollLedger: Omit<PayrollLedgerDTO, 'id'>
  ): Promise<PayrollLedgerDTO> => {
    return apiClient.post('/api/payroll', payrollLedger);
  },

  update: (
    id: number,
    payrollLedger: PayrollLedgerDTO
  ): Promise<PayrollLedgerDTO> => {
    return apiClient.put(`/api/payroll/${id}`, payrollLedger);
  },

  delete: (id: number): Promise<void> => {
    return apiClient.delete(`/api/payroll/${id}`);
  },

  // Search and filtering
  search: (
    criteria: PayrollSearchCriteria,
    params: Pageable = { page: 0, size: 10 }
  ): Promise<PaginatedResponse<PayrollLedgerDTO>> => {
    return apiClient.post('/api/payroll/search', criteria, { params });
  },

  // Get by employee
  getByEmployee: (
    employeeId: number,
    params: Pageable = { page: 0, size: 10 }
  ): Promise<PaginatedResponse<PayrollLedgerDTO>> => {
    return apiClient.get(`/api/payroll/employee/${employeeId}`, { params });
  },

  // Get by pay period
  getByPayPeriod: (
    year: number,
    month: number,
    params: Pageable = { page: 0, size: 10 }
  ): Promise<PaginatedResponse<PayrollLedgerDTO>> => {
    return apiClient.get(`/api/payroll/period/${year}/${month}`, { params });
  },

  // Get by department
  getByDepartment: (
    departmentId: number,
    params: Pageable = { page: 0, size: 10 }
  ): Promise<PaginatedResponse<PayrollLedgerDTO>> => {
    return apiClient.get(`/api/payroll/department/${departmentId}`, { params });
  },

  // Payroll calculations
  calculatePayroll: (
    payrollLedger: PayrollLedgerDTO
  ): Promise<PayrollLedgerDTO> => {
    return apiClient.post('/api/payroll/calculate', payrollLedger);
  },

  validateCalculations: (
    payrollLedger: PayrollLedgerDTO
  ): Promise<{ valid: boolean }> => {
    return apiClient.post('/api/payroll/validate', payrollLedger);
  },

  // Status management
  updateStatus: (
    id: number,
    status: PayrollStatus
  ): Promise<PayrollLedgerDTO> => {
    return apiClient.put(`/api/payroll/${id}/status`, null, {
      params: { status },
    });
  },

  processPayment: (
    id: number,
    paymentReference: string
  ): Promise<PayrollLedgerDTO> => {
    return apiClient.put(`/api/payroll/${id}/payment`, null, {
      params: { paymentReference },
    });
  },

  // Statistics and reporting
  getStatsByDepartment: (
    year: number,
    month: number
  ): Promise<PayrollStatistics[]> => {
    return apiClient.get(`/api/payroll/stats/department/${year}/${month}`);
  },

  getStatsByStatus: (
    year: number,
    month: number
  ): Promise<PayrollStatistics[]> => {
    return apiClient.get(`/api/payroll/stats/status/${year}/${month}`);
  },

  getTotalAmount: (
    year: number,
    month: number
  ): Promise<{ totalAmount: number }> => {
    return apiClient.get(`/api/payroll/total/${year}/${month}`);
  },

  getTotalAmountByDepartment: (
    departmentId: number,
    year: number,
    month: number
  ): Promise<{ totalAmount: number }> => {
    return apiClient.get(
      `/api/payroll/total/department/${departmentId}/${year}/${month}`
    );
  },

  // Payroll generation
  generatePayrollLedgers: (
    year: number,
    month: number
  ): Promise<PayrollLedgerDTO[]> => {
    return apiClient.post(`/api/payroll/generate/${year}/${month}`);
  },

  generatePayrollLedger: (
    employeeId: number,
    year: number,
    month: number
  ): Promise<PayrollLedgerDTO> => {
    return apiClient.post(
      `/api/payroll/generate/employee/${employeeId}/${year}/${month}`
    );
  },
};
