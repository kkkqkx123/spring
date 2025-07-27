package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;

import com.example.demo.model.dto.DepartmentDto;
import com.example.demo.model.entity.Department;
import com.example.demo.service.DepartmentService;

import jakarta.validation.Valid;

/**
 * REST controller for department management
 */
@RestController
@RequestMapping("/api/departments")
@ControllerAdvice
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    /**
     * Get all departments
     * 
     * @return a list of all departments
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('HR_MANAGER') or hasAuthority('USER') or hasAuthority('DEPARTMENT_MANAGER')")
    public ResponseEntity<List<DepartmentDto>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        List<DepartmentDto> departmentDtos = departments.stream()
                .map(departmentService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(departmentDtos);
    }

    /**
     * Get a department by ID
     * 
     * @param id the department ID
     * @return the department
     */
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDto> getDepartmentById(@PathVariable Long id) {
        Department department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(departmentService.convertToDto(department));
    }

    /**
     * Create a new department
     * 
     * @param departmentDto the department data
     * @return the created department
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('HR_MANAGER')")
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody DepartmentDto departmentDto) {
        Department department = departmentService.createDepartment(departmentDto);
        return new ResponseEntity<>(departmentService.convertToDto(department), HttpStatus.CREATED);
    }

    /**
     * Update a department
     * 
     * @param id the department ID
     * @param departmentDto the department data
     * @return the updated department
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('HR_MANAGER')")
    public ResponseEntity<DepartmentDto> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDto departmentDto) {
        Department department = departmentService.updateDepartment(id, departmentDto);
        return ResponseEntity.ok(departmentService.convertToDto(department));
    }

    /**
     * Delete a department
     * 
     * @param id the department ID
     * @return no content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get the department tree
     * 
     * @return the department tree
     */
    @GetMapping("/tree")
    public ResponseEntity<List<DepartmentDto>> getDepartmentTree() {
        List<DepartmentDto> departmentTree = departmentService.getDepartmentTree();
        return ResponseEntity.ok(departmentTree);
    }

    /**
     * Get all child departments of a parent department
     * 
     * @param parentId the parent department ID
     * @return a list of child departments
     */
    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<DepartmentDto>> getChildDepartments(@PathVariable Long parentId) {
        List<Department> children = departmentService.getChildDepartments(parentId);
        List<DepartmentDto> childDtos = children.stream()
                .map(departmentService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(childDtos);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleEntityNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    /**
     * Move a department to a new parent
     * 
     * @param departmentId the department ID
     * @param newParentId the new parent department ID
     * @return the updated department
     */
    @PutMapping("/{departmentId}/move/{newParentId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('HR_MANAGER')")
    public ResponseEntity<DepartmentDto> moveDepartment(@PathVariable Long departmentId, @PathVariable Long newParentId) {
        Department department = departmentService.moveDepartment(departmentId, newParentId);
        return ResponseEntity.ok(departmentService.convertToDto(department));
    }
    
    /**
     * Get a department by name
     * 
     * @param name the department name
     * @return the department
     */
    @GetMapping("/by-name")
    public ResponseEntity<DepartmentDto> getDepartmentByName(@org.springframework.web.bind.annotation.RequestParam String name) {
        Department department = departmentService.getDepartmentByName(name);
        return ResponseEntity.ok(departmentService.convertToDto(department));
    }
}