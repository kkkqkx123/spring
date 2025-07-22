package com.example.demo.service;

import java.util.List;

import com.example.demo.model.dto.DepartmentDto;
import com.example.demo.model.entity.Department;

/**
 * Service interface for department management
 */
public interface DepartmentService {
    
    /**
     * Get all departments
     * 
     * @return a list of all departments
     */
    List<Department> getAllDepartments();
    
    /**
     * Get a department by ID
     * 
     * @param id the department ID
     * @return the department
     * @throws jakarta.persistence.EntityNotFoundException if the department is not found
     */
    Department getDepartmentById(Long id);
    
    /**
     * Get a department by name
     * 
     * @param name the department name
     * @return the department
     * @throws jakarta.persistence.EntityNotFoundException if the department is not found
     */
    Department getDepartmentByName(String name);
    
    /**
     * Create a new department
     * 
     * @param departmentDto the department data
     * @return the created department
     * @throws IllegalArgumentException if the department name already exists
     */
    Department createDepartment(DepartmentDto departmentDto);
    
    /**
     * Update a department
     * 
     * @param id the department ID
     * @param departmentDto the department data
     * @return the updated department
     * @throws jakarta.persistence.EntityNotFoundException if the department is not found
     * @throws IllegalArgumentException if the department name already exists
     */
    Department updateDepartment(Long id, DepartmentDto departmentDto);
    
    /**
     * Delete a department
     * 
     * @param id the department ID
     * @throws jakarta.persistence.EntityNotFoundException if the department is not found
     * @throws IllegalStateException if the department has children or employees
     */
    void deleteDepartment(Long id);
    
    /**
     * Get the department tree
     * 
     * @return the department tree as a list of root departments with their children
     */
    List<DepartmentDto> getDepartmentTree();
    
    /**
     * Get all child departments of a parent department
     * 
     * @param parentId the parent department ID
     * @return a list of child departments
     */
    List<Department> getChildDepartments(Long parentId);
    
    /**
     * Move a department to a new parent
     * 
     * @param departmentId the department ID
     * @param newParentId the new parent department ID
     * @return the updated department
     * @throws jakarta.persistence.EntityNotFoundException if the department or parent is not found
     * @throws IllegalArgumentException if the new parent is a child of the department
     */
    Department moveDepartment(Long departmentId, Long newParentId);
    
    /**
     * Convert a Department entity to a DepartmentDto
     * 
     * @param department the department entity
     * @return the department DTO
     */
    DepartmentDto convertToDto(Department department);
    
    /**
     * Convert a DepartmentDto to a Department entity
     * 
     * @param departmentDto the department DTO
     * @return the department entity
     */
    Department convertToEntity(DepartmentDto departmentDto);
}