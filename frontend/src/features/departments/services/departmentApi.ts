import { apiClient } from '../../../services/api';
import { Department } from '../../../types';

export interface DepartmentCreateRequest {
  name: string;
  description?: string;
  parentId?: number;
}

export interface DepartmentUpdateRequest {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
}

export interface DepartmentMoveRequest {
  departmentId: number;
  newParentId?: number;
  newPosition?: number;
}

export class DepartmentApi {
  static async getDepartments(): Promise<Department[]> {
    const response = await apiClient.get('/api/departments');
    return response.data;
  }

  static async getDepartmentTree(): Promise<Department[]> {
    const response = await apiClient.get('/api/departments/tree');
    return response.data;
  }

  static async getDepartment(id: number): Promise<Department> {
    const response = await apiClient.get(`/api/departments/${id}`);
    return response.data;
  }

  static async createDepartment(
    department: DepartmentCreateRequest
  ): Promise<Department> {
    const response = await apiClient.post('/api/departments', department);
    return response.data;
  }

  static async updateDepartment(
    department: DepartmentUpdateRequest
  ): Promise<Department> {
    const response = await apiClient.put(
      `/api/departments/${department.id}`,
      department
    );
    return response.data;
  }

  static async deleteDepartment(id: number): Promise<void> {
    await apiClient.delete(`/api/departments/${id}`);
  }

  static async moveDepartment(
    moveRequest: DepartmentMoveRequest
  ): Promise<Department> {
    const response = await apiClient.put(
      `/api/departments/${moveRequest.departmentId}/move`,
      moveRequest
    );
    return response.data;
  }

  static async getDepartmentEmployees(id: number): Promise<any[]> {
    const response = await apiClient.get(`/api/departments/${id}/employees`);
    return response.data;
  }
}
