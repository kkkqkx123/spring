package com.example.demo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;

/**
 * Service interface for employee search operations
 */
public interface EmployeeSearchService {
    
    /**
     * Search employees by criteria with pagination and caching
     * 
     * @param criteria the search criteria
     * @param pageable pagination information
     * @return page of employees matching criteria
     */
    Page<Employee> searchEmployees(EmployeeSearchCriteria criteria, Pageable pageable);
    
    /**
     * Search employees by name with pagination and caching
     * 
     * @param name the name to search for (partial match, case-insensitive)
     * @param pageable pagination information
     * @return page of employees matching name
     */
    Page<Employee> searchByName(String name, Pageable pageable);
    
    /**
     * Search employees by email with pagination and caching
     * 
     * @param email the email to search for (partial match, case-insensitive)
     * @param pageable pagination information
     * @return page of employees matching email
     */
    Page<Employee> searchByEmail(String email, Pageable pageable);
    
    /**
     * Search employees by department name with pagination and caching
     * 
     * @param departmentName the department name to search for (partial match, case-insensitive)
     * @param pageable pagination information
     * @return page of employees in matching departments
     */
    Page<Employee> searchByDepartmentName(String departmentName, Pageable pageable);
    
    /**
     * Search employees by position job title with pagination and caching
     * 
     * @param jobTitle the job title to search for (partial match, case-insensitive)
     * @param pageable pagination information
     * @return page of employees with matching positions
     */
    Page<Employee> searchByJobTitle(String jobTitle, Pageable pageable);
    
    /**
     * Clear search cache for specific criteria
     * 
     * @param criteria the search criteria to clear cache for
     */
    void clearSearchCache(EmployeeSearchCriteria criteria);
    
    /**
     * Clear all search caches
     */
    void clearAllSearchCaches();
}