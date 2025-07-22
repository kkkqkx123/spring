package com.example.demo.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.dto.DepartmentDto;
import com.example.demo.model.entity.Department;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.service.DepartmentService;

import jakarta.persistence.EntityNotFoundException;

/**
 * Implementation of DepartmentService
 */
@Service
public class DepartmentServiceImpl implements DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    /**
     * Get all departments
     */
    @Override
    @Cacheable(value = "departments")
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    /**
     * Get a department by ID
     */
    @Override
    @Cacheable(value = "departments", key = "#id")
    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));
    }

    /**
     * Get a department by name
     */
    @Override
    @Cacheable(value = "departments", key = "#name")
    public Department getDepartmentByName(String name) {
        return departmentRepository.findByName(name)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with name: " + name));
    }

    /**
     * Create a new department
     */
    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public Department createDepartment(DepartmentDto departmentDto) {
        // Check if department name already exists
        if (departmentRepository.existsByName(departmentDto.getName())) {
            throw new IllegalArgumentException("Department name already exists: " + departmentDto.getName());
        }

        Department department = convertToEntity(departmentDto);

        // Set parent if provided
        if (departmentDto.getParentId() != null) {
            Department parent = getDepartmentById(departmentDto.getParentId());
            parent.addChild(department);
        }

        Department savedDepartment = departmentRepository.save(department);

        // Update depPath after save
        if (departmentDto.getParentId() != null) {
            Department parent = getDepartmentById(departmentDto.getParentId());
            savedDepartment.setDepPath(parent.getDepPath() + savedDepartment.getId() + "/");
            savedDepartment = departmentRepository.save(savedDepartment);
        } else {
            savedDepartment.setDepPath("/" + savedDepartment.getId() + "/");
            savedDepartment = departmentRepository.save(savedDepartment);
        }

        return savedDepartment;
    }

    /**
     * Update a department
     */
    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public Department updateDepartment(Long id, DepartmentDto departmentDto) {
        Department department = getDepartmentById(id);

        // Check if department name already exists (if changed)
        if (!department.getName().equals(departmentDto.getName()) && 
            departmentRepository.existsByName(departmentDto.getName())) {
            throw new IllegalArgumentException("Department name already exists: " + departmentDto.getName());
        }

        // Update basic properties
        department.setName(departmentDto.getName());

        // Handle parent change if needed
        if (departmentDto.getParentId() != null && 
            (department.getParentId() == null || !department.getParentId().equals(departmentDto.getParentId()))) {
            
            // Remove from old parent if exists
            if (department.getParent() != null) {
                department.getParent().removeChild(department);
            }
            
            // Add to new parent
            Department newParent = getDepartmentById(departmentDto.getParentId());
            
            // Check if new parent is not a child of this department
            if (isChildOf(newParent.getId(), department.getId())) {
                throw new IllegalArgumentException("Cannot move department to its own child");
            }
            
            newParent.addChild(department);
            
            // Update depPath
            department.setDepPath(newParent.getDepPath() + department.getId() + "/");
            
            // Update depPath for all children
            updateChildrenDepPath(department);
        } else if (departmentDto.getParentId() == null && department.getParentId() != null) {
            // Remove from parent
            department.getParent().removeChild(department);
            department.setParent(null);
            department.setParentId(null);
            
            // Update depPath
            department.setDepPath("/" + department.getId() + "/");
            
            // Update depPath for all children
            updateChildrenDepPath(department);
        }

        return departmentRepository.save(department);
    }

    /**
     * Delete a department
     */
    @Override
    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);

        // Check if department has children
        if (!department.getChildren().isEmpty()) {
            throw new IllegalStateException("Cannot delete department with children");
        }

        // Check if department has employees
        long employeeCount = departmentRepository.countEmployeesByDepartmentId(id);
        if (employeeCount > 0) {
            throw new IllegalStateException("Cannot delete department with employees");
        }

        // Remove from parent if exists
        if (department.getParent() != null) {
            department.getParent().removeChild(department);
            departmentRepository.save(department.getParent());
        }

        departmentRepository.delete(department);
    }

    /**
     * Get the department tree
     */
    @Override
    @Cacheable(value = "departmentTree")
    public List<DepartmentDto> getDepartmentTree() {
        List<Department> allDepartments = departmentRepository.findAll();
        Map<Long, DepartmentDto> dtoMap = new HashMap<>();

        // Convert all departments to DTOs
        for (Department dept : allDepartments) {
            dtoMap.put(dept.getId(), convertToDto(dept));
        }

        // Build the tree structure
        List<DepartmentDto> rootDepartments = new ArrayList<>();
        for (Department dept : allDepartments) {
            DepartmentDto dto = dtoMap.get(dept.getId());
            
            if (dept.getParentId() == null) {
                // Root department
                rootDepartments.add(dto);
            } else {
                // Child department
                DepartmentDto parentDto = dtoMap.get(dept.getParentId());
                if (parentDto != null) {
                    parentDto.getChildren().add(dto);
                }
            }
        }

        return rootDepartments;
    }

    /**
     * Get all child departments of a parent department
     */
    @Override
    @Cacheable(value = "departmentChildren", key = "#parentId")
    public List<Department> getChildDepartments(Long parentId) {
        return departmentRepository.findByParentId(parentId);
    }

    /**
     * Move a department to a new parent
     */
    @Override
    @Transactional
    @CacheEvict(value = {"departments", "departmentTree", "departmentChildren"}, allEntries = true)
    public Department moveDepartment(Long departmentId, Long newParentId) {
        Department department = getDepartmentById(departmentId);
        Department newParent = getDepartmentById(newParentId);

        // Check if new parent is not a child of this department
        if (isChildOf(newParent.getId(), department.getId())) {
            throw new IllegalArgumentException("Cannot move department to its own child");
        }

        // Remove from old parent if exists
        if (department.getParent() != null) {
            department.getParent().removeChild(department);
        }

        // Add to new parent
        newParent.addChild(department);

        // Update depPath
        department.setDepPath(newParent.getDepPath() + department.getId() + "/");

        // Update depPath for all children
        updateChildrenDepPath(department);

        return departmentRepository.save(department);
    }

    /**
     * Convert a Department entity to a DepartmentDto
     */
    @Override
    public DepartmentDto convertToDto(Department department) {
        if (department == null) {
            return null;
        }

        DepartmentDto dto = new DepartmentDto();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setParentId(department.getParentId());
        dto.setIsParent(department.getIsParent());
        dto.setDepPath(department.getDepPath());

        // Set parent name if parent exists
        if (department.getParent() != null) {
            dto.setParentName(department.getParent().getName());
        }

        // Set employee count
        long employeeCount = departmentRepository.countEmployeesByDepartmentId(department.getId());
        dto.setEmployeeCount((int) employeeCount);

        return dto;
    }

    /**
     * Convert a DepartmentDto to a Department entity
     */
    @Override
    public Department convertToEntity(DepartmentDto dto) {
        if (dto == null) {
            return null;
        }

        Department department = new Department();
        department.setId(dto.getId());
        department.setName(dto.getName());
        department.setParentId(dto.getParentId());
        department.setIsParent(dto.getIsParent());
        department.setDepPath(dto.getDepPath());

        return department;
    }

    /**
     * Check if a department is a child of another department
     */
    private boolean isChildOf(Long departmentId, Long potentialParentId) {
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            return false;
        }

        // Check if the department is a direct child
        if (department.getParentId() != null && department.getParentId().equals(potentialParentId)) {
            return true;
        }

        // Check if any parent is the potential parent
        while (department.getParentId() != null) {
            department = departmentRepository.findById(department.getParentId()).orElse(null);
            if (department == null) {
                return false;
            }
            if (department.getId().equals(potentialParentId)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update depPath for all children of a department
     */
    private void updateChildrenDepPath(Department department) {
        List<Department> children = departmentRepository.findByParentId(department.getId());
        for (Department child : children) {
            child.setDepPath(department.getDepPath() + child.getId() + "/");
            departmentRepository.save(child);
            updateChildrenDepPath(child);
        }
    }
}