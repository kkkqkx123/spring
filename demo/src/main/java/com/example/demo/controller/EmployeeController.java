package com.example.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;
import com.example.demo.service.EmployeeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for employee management operations
 */
@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;
    
    /**
     * Get all employees with pagination
     * 
     * @param pageable pagination information
     * @return page of employees
     */
    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public ResponseEntity<Page<Employee>> getAllEmployees(
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        log.info("REST request to get all employees with pagination");
        Page<Employee> employees = employeeService.getAllEmployees(pageable);
        return ResponseEntity.ok(employees);
    }
    
    /**
     * Get employee by ID
     * 
     * @param id the employee ID
     * @return the employee
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        log.info("REST request to get employee by ID: {}", id);
        Employee employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }
    
    /**
     * Create a new employee
     * 
     * @param employee the employee to create
     * @return the created employee
     */
    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public ResponseEntity<Employee> createEmployee(@Valid @RequestBody Employee employee) {
        log.info("REST request to create employee: {}", employee.getEmployeeNumber());
        Employee createdEmployee = employeeService.createEmployee(employee);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEmployee);
    }
    
    /**
     * Update an existing employee
     * 
     * @param id the employee ID
     * @param employee the updated employee details
     * @return the updated employee
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE')")
    public ResponseEntity<Employee> updateEmployee(
            @PathVariable Long id, @Valid @RequestBody Employee employee) {
        log.info("REST request to update employee with ID: {}", id);
        Employee updatedEmployee = employeeService.updateEmployee(id, employee);
        return ResponseEntity.ok(updatedEmployee);
    }
    
    /**
     * Delete an employee by ID
     * 
     * @param id the employee ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        log.info("REST request to delete employee with ID: {}", id);
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Delete multiple employees by IDs
     * 
     * @param ids list of employee IDs to delete
     * @return response with count of deleted employees
     */
    @DeleteMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE')")
    public ResponseEntity<Integer> deleteEmployees(@RequestBody List<Long> ids) {
        log.info("REST request to delete multiple employees: {}", ids);
        int count = employeeService.deleteEmployees(ids);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Search employees by criteria with pagination
     * 
     * @param criteria the search criteria
     * @param pageable pagination information
     * @return page of employees matching criteria
     */
    @PostMapping("/search")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public ResponseEntity<Page<Employee>> searchEmployees(
            @RequestBody EmployeeSearchCriteria criteria,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        log.info("REST request to search employees with criteria: {}", criteria);
        Page<Employee> employees = employeeService.searchEmployees(criteria, pageable);
        return ResponseEntity.ok(employees);
    }
    
    /**
     * Import employees from Excel file
     * 
     * @param file the Excel file to import
     * @return list of imported employees
     * @throws IOException if file reading fails
     */
    @PostMapping("/import")
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public ResponseEntity<List<Employee>> importEmployees(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("REST request to import employees from Excel file: {}", file.getOriginalFilename());
        List<Employee> importedEmployees = employeeService.importEmployeesFromExcel(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(importedEmployees);
    }
    
    /**
     * Export employees to Excel file
     * 
     * @param ids list of employee IDs to export (null for all employees)
     * @return Excel file as byte array
     * @throws IOException if file writing fails
     */
    @PostMapping("/export")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public ResponseEntity<byte[]> exportEmployees(@RequestBody(required = false) List<Long> ids) throws IOException {
        log.info("REST request to export employees to Excel. IDs: {}", ids);
        byte[] excelData = employeeService.exportEmployeesToExcel(ids);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "employees.xlsx");
        headers.setContentLength(excelData.length);
        
        return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
    }
    
    /**
     * Get employee import template
     * 
     * @return Excel template file as byte array
     * @throws IOException if file creation fails
     */
    @GetMapping("/import-template")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public ResponseEntity<byte[]> getImportTemplate() throws IOException {
        log.info("REST request to get employee import template");
        byte[] templateData = employeeService.getEmployeeImportTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "employee_import_template.xlsx");
        headers.setContentLength(templateData.length);
        
        return new ResponseEntity<>(templateData, headers, HttpStatus.OK);
    }
}