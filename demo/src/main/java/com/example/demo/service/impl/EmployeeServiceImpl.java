package com.example.demo.service.impl;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.InvalidDataException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.specification.EmployeeSpecification;
import com.example.demo.service.EmployeeService;
import com.example.demo.service.ExcelService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of EmployeeService interface
 * Provides business logic for employee management operations
 */
@Service
@Slf4j
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final ExcelService excelService;
    
    public EmployeeServiceImpl(EmployeeRepository employeeRepository, ExcelService excelService) {
        this.employeeRepository = employeeRepository;
        this.excelService = excelService;
    }
    
    @Override
    public Page<Employee> getAllEmployees(Pageable pageable) {
        log.info("Fetching all employees with pagination: {}", pageable);
        return employeeRepository.findAll(pageable);
    }
    
    @Override
    @Cacheable(value = "employees", key = "#id")
    public Employee getEmployeeById(Long id) {
        log.info("Fetching employee by ID: {}", id);
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
    }
    
    @Override
    @Cacheable(value = "employees", key = "#employeeNumber")
    public Employee getEmployeeByEmployeeNumber(String employeeNumber) {
        log.info("Fetching employee by employee number: {}", employeeNumber);
        return employeeRepository.findByEmployeeNumber(employeeNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "employeeNumber", employeeNumber));
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public Employee createEmployee(Employee employee) {
        log.info("Creating new employee: {}", employee.getEmployeeNumber());
        
        // Validate employee data
        validateEmployee(employee);
        
        // Check for duplicate employee number
        if (employeeRepository.existsByEmployeeNumber(employee.getEmployeeNumber())) {
            throw new DuplicateResourceException("Employee", "employeeNumber", employee.getEmployeeNumber());
        }
        
        // Check for duplicate email if provided
        if (StringUtils.hasText(employee.getEmail()) && employeeRepository.existsByEmail(employee.getEmail())) {
            throw new DuplicateResourceException("Employee", "email", employee.getEmail());
        }
        
        return employeeRepository.save(employee);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public Employee updateEmployee(Long id, Employee employeeDetails) {
        log.info("Updating employee with ID: {}", id);
        
        // Find existing employee
        Employee existingEmployee = getEmployeeById(id);
        
        // Validate employee data
        validateEmployee(employeeDetails);
        
        // Check for duplicate employee number if changed
        if (!existingEmployee.getEmployeeNumber().equals(employeeDetails.getEmployeeNumber()) &&
                employeeRepository.existsByEmployeeNumber(employeeDetails.getEmployeeNumber())) {
            throw new DuplicateResourceException("Employee", "employeeNumber", employeeDetails.getEmployeeNumber());
        }
        
        // Check for duplicate email if changed and provided
        if (StringUtils.hasText(employeeDetails.getEmail()) && 
                (existingEmployee.getEmail() == null || !existingEmployee.getEmail().equals(employeeDetails.getEmail())) &&
                employeeRepository.existsByEmail(employeeDetails.getEmail())) {
            throw new DuplicateResourceException("Employee", "email", employeeDetails.getEmail());
        }
        
        // Update employee fields
        existingEmployee.setName(employeeDetails.getName());
        existingEmployee.setEmployeeNumber(employeeDetails.getEmployeeNumber());
        existingEmployee.setEmail(employeeDetails.getEmail());
        existingEmployee.setPhone(employeeDetails.getPhone());
        existingEmployee.setDepartment(employeeDetails.getDepartment());
        existingEmployee.setPosition(employeeDetails.getPosition());
        existingEmployee.setHireDate(employeeDetails.getHireDate());
        existingEmployee.setStatus(employeeDetails.getStatus());
        existingEmployee.setGender(employeeDetails.getGender());
        existingEmployee.setBirthDate(employeeDetails.getBirthDate());
        existingEmployee.setAddress(employeeDetails.getAddress());
        existingEmployee.setSalary(employeeDetails.getSalary());
        existingEmployee.setEmergencyContactName(employeeDetails.getEmergencyContactName());
        existingEmployee.setEmergencyContactPhone(employeeDetails.getEmergencyContactPhone());
        existingEmployee.setNotes(employeeDetails.getNotes());
        
        return employeeRepository.save(existingEmployee);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "employees", key = "#id")
    public void deleteEmployee(Long id) {
        log.info("Deleting employee with ID: {}", id);
        
        // Check if employee exists
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee", "id", id);
        }
        
        employeeRepository.deleteById(id);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "employees", allEntries = true)
    public int deleteEmployees(List<Long> ids) {
        log.info("Batch deleting {} employees", ids.size());
        
        // Find all employees by IDs
        List<Employee> employees = employeeRepository.findByIdIn(ids);
        
        // Delete found employees
        employeeRepository.deleteAll(employees);
        
        return employees.size();
    }
    
    @Override
    @Cacheable(value = "employeeSearchResults", key = "T(java.util.Objects).hash(#criteria, #pageable)")
    public Page<Employee> searchEmployees(EmployeeSearchCriteria criteria, Pageable pageable) {
        log.info("Searching employees with criteria: {}", criteria);
        
        // Validate search criteria
        validateSearchCriteria(criteria);
        
        // Create specification from criteria
        Specification<Employee> spec = EmployeeSpecification.createSpecification(criteria);
        
        return employeeRepository.findAll(spec, pageable);
    }
    
    @Override
    public Page<Employee> getEmployeesByDepartment(Long departmentId, Pageable pageable) {
        log.info("Fetching employees by department ID: {}", departmentId);
        return employeeRepository.findByDepartmentId(departmentId, pageable);
    }
    
    @Override
    public Page<Employee> getEmployeesByPosition(Long positionId, Pageable pageable) {
        log.info("Fetching employees by position ID: {}", positionId);
        return employeeRepository.findByPositionId(positionId, pageable);
    }
    
    @Override
    public Page<Employee> getEmployeesByStatus(Employee.EmployeeStatus status, Pageable pageable) {
        log.info("Fetching employees by status: {}", status);
        return employeeRepository.findByStatus(status, pageable);
    }
    
    @Override
    public boolean existsById(Long id) {
        return employeeRepository.existsById(id);
    }
    
    @Override
    public boolean existsByEmployeeNumber(String employeeNumber) {
        return employeeRepository.existsByEmployeeNumber(employeeNumber);
    }
    
    @Override
    public boolean existsByEmail(String email) {
        return employeeRepository.existsByEmail(email);
    }
    
    @Override
    public long countByDepartment(Long departmentId) {
        return employeeRepository.countByDepartmentId(departmentId);
    }
    
    @Override
    public long countByPosition(Long positionId) {
        return employeeRepository.countByPositionId(positionId);
    }
    
    @Override
    public List<Object[]> getEmployeeCountByDepartment() {
        return employeeRepository.getEmployeeCountByDepartment();
    }
    
    @Override
    public List<Object[]> getEmployeeCountByStatus() {
        return employeeRepository.getEmployeeCountByStatus();
    }
    
    /**
     * Validate employee data
     * 
     * @param employee the employee to validate
     * @throws InvalidDataException if validation fails
     */
    private void validateEmployee(Employee employee) {
        // Check required fields
        if (employee == null) {
            throw new InvalidDataException("Employee cannot be null");
        }
        
        if (!StringUtils.hasText(employee.getEmployeeNumber())) {
            throw new InvalidDataException("Employee number is required");
        }
        
        if (!StringUtils.hasText(employee.getName())) {
            throw new InvalidDataException("Employee name is required");
        }
        
        if (employee.getDepartment() == null || employee.getDepartment().getId() == null) {
            throw new InvalidDataException("Department is required");
        }
        
        // Validate email format if provided
        if (StringUtils.hasText(employee.getEmail())) {
            String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
            if (!employee.getEmail().matches(emailRegex)) {
                throw new InvalidDataException("Invalid email format");
            }
        }
        
        // Validate phone format if provided
        if (StringUtils.hasText(employee.getPhone())) {
            String phoneRegex = "^[+]?[0-9\\s\\-()]{10,20}$";
            if (!employee.getPhone().matches(phoneRegex)) {
                throw new InvalidDataException("Invalid phone format");
            }
        }
        
        // Validate emergency contact phone if provided
        if (StringUtils.hasText(employee.getEmergencyContactPhone())) {
            String phoneRegex = "^[+]?[0-9\\s\\-()]{10,20}$";
            if (!employee.getEmergencyContactPhone().matches(phoneRegex)) {
                throw new InvalidDataException("Invalid emergency contact phone format");
            }
        }
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
    
    // ExcelService is now injected via constructor
    
    @Override
    @Transactional
    public List<Employee> importEmployeesFromExcel(MultipartFile file) throws IOException {
        log.info("Importing employees from Excel file: {}", file.getOriginalFilename());
        
        // Parse employees from Excel
        List<Employee> employees = excelService.importEmployeesFromExcel(file);
        
        // Save all employees
        List<Employee> savedEmployees = new ArrayList<>();
        for (Employee employee : employees) {
            try {
                savedEmployees.add(createEmployee(employee));
            } catch (Exception e) {
                log.error("Error saving employee: {}", e.getMessage());
                throw e;
            }
        }
        
        return savedEmployees;
    }
    
    @Override
    public byte[] exportEmployeesToExcel(List<Long> employeeIds) throws IOException {
        log.info("Exporting employees to Excel. IDs: {}", employeeIds);
        
        List<Employee> employees;
        if (employeeIds == null || employeeIds.isEmpty()) {
            // Export all employees
            employees = employeeRepository.findAll();
        } else {
            // Export selected employees
            employees = employeeRepository.findByIdIn(employeeIds);
        }
        
        return excelService.exportEmployeesToExcel(employees);
    }
    
    @Override
    public byte[] getEmployeeImportTemplate() throws IOException {
        log.info("Generating employee import template");
        return excelService.getEmployeeImportTemplate();
    }
}