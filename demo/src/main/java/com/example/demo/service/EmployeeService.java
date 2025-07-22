package com.example.demo.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;

/**
 * Service interface for employee management operations
 */
public interface EmployeeService {
    
    /**
     * Get all employees with pagination
     * 
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> getAllEmployees(Pageable pageable);
    
    /**
     * Get employee by ID
     * 
     * @param id the employee ID
     * @return the employee
     * @throws com.example.demo.exception.ResourceNotFoundException if employee not found
     */
    Employee getEmployeeById(Long id);
    
    /**
     * Get employee by employee number
     * 
     * @param employeeNumber the employee number
     * @return the employee
     * @throws com.example.demo.exception.ResourceNotFoundException if employee not found
     */
    Employee getEmployeeByEmployeeNumber(String employeeNumber);
    
    /**
     * Create a new employee
     * 
     * @param employee the employee to create
     * @return the created employee
     * @throws com.example.demo.exception.DuplicateResourceException if employee number or email already exists
     * @throws com.example.demo.exception.InvalidDataException if employee data is invalid
     */
    Employee createEmployee(Employee employee);
    
    /**
     * Update an existing employee
     * 
     * @param id the employee ID
     * @param employeeDetails the updated employee details
     * @return the updated employee
     * @throws com.example.demo.exception.ResourceNotFoundException if employee not found
     * @throws com.example.demo.exception.DuplicateResourceException if employee number or email already exists
     * @throws com.example.demo.exception.InvalidDataException if employee data is invalid
     */
    Employee updateEmployee(Long id, Employee employeeDetails);
    
    /**
     * Delete an employee by ID
     * 
     * @param id the employee ID
     * @throws com.example.demo.exception.ResourceNotFoundException if employee not found
     */
    void deleteEmployee(Long id);
    
    /**
     * Delete multiple employees by IDs
     * 
     * @param ids list of employee IDs to delete
     * @return count of deleted employees
     */
    int deleteEmployees(List<Long> ids);
    
    /**
     * Search employees by criteria with pagination
     * 
     * @param criteria the search criteria
     * @param pageable pagination information
     * @return page of employees matching criteria
     * @throws com.example.demo.exception.InvalidDataException if search criteria is invalid
     */
    Page<Employee> searchEmployees(EmployeeSearchCriteria criteria, Pageable pageable);
    
    /**
     * Get employees by department ID with pagination
     * 
     * @param departmentId the department ID
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> getEmployeesByDepartment(Long departmentId, Pageable pageable);
    
    /**
     * Get employees by position ID with pagination
     * 
     * @param positionId the position ID
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> getEmployeesByPosition(Long positionId, Pageable pageable);
    
    /**
     * Get employees by status with pagination
     * 
     * @param status the employee status
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> getEmployeesByStatus(Employee.EmployeeStatus status, Pageable pageable);
    
    /**
     * Check if employee exists by ID
     * 
     * @param id the employee ID
     * @return true if exists, false otherwise
     */
    boolean existsById(Long id);
    
    /**
     * Check if employee exists by employee number
     * 
     * @param employeeNumber the employee number
     * @return true if exists, false otherwise
     */
    boolean existsByEmployeeNumber(String employeeNumber);
    
    /**
     * Check if employee exists by email
     * 
     * @param email the employee email
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Count employees by department
     * 
     * @param departmentId the department ID
     * @return count of employees
     */
    long countByDepartment(Long departmentId);
    
    /**
     * Count employees by position
     * 
     * @param positionId the position ID
     * @return count of employees
     */
    long countByPosition(Long positionId);
    
    /**
     * Get employee statistics by department
     * 
     * @return list of department statistics
     */
    List<Object[]> getEmployeeCountByDepartment();
    
    /**
     * Get employee statistics by status
     * 
     * @return list of status statistics
     */
    List<Object[]> getEmployeeCountByStatus();
}