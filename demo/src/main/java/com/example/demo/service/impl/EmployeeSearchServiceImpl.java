package com.example.demo.service.impl;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.demo.exception.InvalidDataException;
import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.specification.EmployeeSpecification;
import com.example.demo.service.EmployeeSearchService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of EmployeeSearchService
 * Provides advanced search functionality with Redis caching
 */
@Service
@Slf4j
public class EmployeeSearchServiceImpl implements EmployeeSearchService {

    private final EmployeeRepository employeeRepository;
    
    public EmployeeSearchServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    
    @Override
    @Cacheable(value = "employeeSearchResults", key = "T(java.util.Objects).hash(#criteria, #pageable)")
    public Page<Employee> searchEmployees(EmployeeSearchCriteria criteria, Pageable pageable) {
        log.info("Performing advanced employee search with criteria: {}", criteria);
        
        // Validate search criteria
        validateSearchCriteria(criteria);
        
        // Create specification from criteria
        Specification<Employee> spec = EmployeeSpecification.createSpecification(criteria);
        
        return employeeRepository.findAll(spec, pageable);
    }
    
    @Override
    @Cacheable(value = "employeeNameSearch", key = "T(java.util.Objects).hash(#name, #pageable)")
    public Page<Employee> searchByName(String name, Pageable pageable) {
        log.info("Searching employees by name: {}", name);
        return employeeRepository.findByNameContainingIgnoreCase(name, pageable);
    }
    
    @Override
    @Cacheable(value = "employeeEmailSearch", key = "T(java.util.Objects).hash(#email, #pageable)")
    public Page<Employee> searchByEmail(String email, Pageable pageable) {
        log.info("Searching employees by email: {}", email);
        return employeeRepository.findByEmailContainingIgnoreCase(email, pageable);
    }
    
    @Override
    @Cacheable(value = "employeeDepartmentSearch", key = "T(java.util.Objects).hash(#departmentName, #pageable)")
    public Page<Employee> searchByDepartmentName(String departmentName, Pageable pageable) {
        log.info("Searching employees by department name: {}", departmentName);
        return employeeRepository.findByDepartmentNameContainingIgnoreCase(departmentName, pageable);
    }
    
    @Override
    @Cacheable(value = "employeeJobTitleSearch", key = "T(java.util.Objects).hash(#jobTitle, #pageable)")
    public Page<Employee> searchByJobTitle(String jobTitle, Pageable pageable) {
        log.info("Searching employees by job title: {}", jobTitle);
        return employeeRepository.findByPositionJobTitleContainingIgnoreCase(jobTitle, pageable);
    }
    
    @Override
    @CacheEvict(value = "employeeSearchResults", key = "T(java.util.Objects).hash(#criteria, '*')")
    public void clearSearchCache(EmployeeSearchCriteria criteria) {
        log.info("Clearing search cache for criteria: {}", criteria);
    }
    
    @Override
    @CacheEvict(value = {
            "employeeSearchResults", 
            "employeeNameSearch", 
            "employeeEmailSearch", 
            "employeeDepartmentSearch", 
            "employeeJobTitleSearch"
    }, allEntries = true)
    public void clearAllSearchCaches() {
        log.info("Clearing all employee search caches");
    }
    
    /**
     * Validate search criteria
     * 
     * @param criteria the search criteria to validate
     * @throws InvalidDataException if validation fails
     */
    private void validateSearchCriteria(EmployeeSearchCriteria criteria) {
        if (criteria == null) {
            throw new InvalidDataException("Search criteria cannot be null");
        }
        
        // Validate date ranges
        if (!criteria.isValidHireDateRange()) {
            throw new InvalidDataException("Invalid hire date range");
        }
        
        if (!criteria.isValidBirthDateRange()) {
            throw new InvalidDataException("Invalid birth date range");
        }
        
        // Validate salary range
        if (!criteria.isValidSalaryRange()) {
            throw new InvalidDataException("Invalid salary range");
        }
    }
}