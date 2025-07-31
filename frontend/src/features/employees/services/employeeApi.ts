import { ApiClient } from '../../../services/api';
import type { Employee, PaginatedResponse, Pageable } from '../../../types';

export interface EmployeeSearchCriteria {
  name?: string;
  departmentId?: number;
  positionId?: number;
  status?: string;
  email?: string;
}

export interface EmployeeCreateRequest {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: number;
  positionId: number;
  hireDate: string;
  salary?: number;
  status: string;
}

export interface EmployeeUpdateRequest extends EmployeeCreateRequest {
  id: number;
}

export class EmployeeApi {
  constructor(private client: ApiClient) {}

  async getEmployees(pageable: Pageable): Promise<PaginatedResponse<Employee>> {
    const response = await this.client.get<PaginatedResponse<Employee>>(
      '/api/employees',
      {
        params: pageable,
      }
    );
    return response;
  }

  async getEmployee(id: number): Promise<Employee> {
    const response = await this.client.get<Employee>(`/api/employees/${id}`);
    return response;
  }

  async createEmployee(employee: EmployeeCreateRequest): Promise<Employee> {
    const response = await this.client.post<Employee>(
      '/api/employees',
      employee
    );
    return response;
  }

  async updateEmployee(
    id: number,
    employee: EmployeeUpdateRequest
  ): Promise<Employee> {
    const response = await this.client.put<Employee>(
      `/api/employees/${id}`,
      employee
    );
    return response;
  }

  async deleteEmployee(id: number): Promise<void> {
    await this.client.delete<void>(`/api/employees/${id}`);
  }

  async deleteEmployees(ids: number[]): Promise<void> {
    await this.client.post<void>('/api/employees/bulk-delete', { ids });
  }

  async searchEmployees(
    criteria: EmployeeSearchCriteria,
    pageable: Pageable
  ): Promise<PaginatedResponse<Employee>> {
    const response = await this.client.post<PaginatedResponse<Employee>>(
      '/api/employees/search',
      criteria,
      {
        params: pageable,
      }
    );
    return response;
  }

  async importEmployees(file: File): Promise<Employee[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<Employee[]>(
      '/api/employees/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response;
  }

  async exportEmployees(ids?: number[]): Promise<Blob> {
    const response = await this.client.postRaw(
      '/api/employees/export',
      ids || [],
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async uploadProfilePicture(employeeId: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<string>(
      `/api/employees/${employeeId}/profile-picture`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response;
  }
}

// Create singleton instance
import { apiClient } from '../../../services/api';
export const employeeApi = new EmployeeApi(apiClient);
