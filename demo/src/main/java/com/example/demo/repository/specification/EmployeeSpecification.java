package com.example.demo.repository.specification;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;

import jakarta.persistence.criteria.Predicate;

/**
 * Specification class for building dynamic queries for Employee entity
 * Supports complex search criteria with multiple filters
 */
public class EmployeeSpecification {
    
    /**
     * Create specification based on search criteria
     * 
     * @param criteria the search criteria
     * @return specification for dynamic query building
     */
    @SuppressWarnings("unused")
    public static Specification<Employee> createSpecification(EmployeeSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Name filter (case-insensitive partial match)
            if (criteria.getName() != null && !criteria.getName().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("name")),
                    "%" + criteria.getName().toLowerCase() + "%"
                ));
            }
            
            // Email filter (case-insensitive partial match)
            if (criteria.getEmail() != null && !criteria.getEmail().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("email")),
                    "%" + criteria.getEmail().toLowerCase() + "%"
                ));
            }
            
            // Employee number filter (exact match)
            if (criteria.getEmployeeNumber() != null && !criteria.getEmployeeNumber().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("employeeNumber"),
                    criteria.getEmployeeNumber()
                ));
            }
            
            // Department ID filter
            if (criteria.getDepartmentId() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("department").get("id"),
                    criteria.getDepartmentId()
                ));
            }
            
            // Department name filter (case-insensitive partial match)
            if (criteria.getDepartmentName() != null && !criteria.getDepartmentName().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("department").get("name")),
                    "%" + criteria.getDepartmentName().toLowerCase() + "%"
                ));
            }
            
            // Position ID filter
            if (criteria.getPositionId() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("position").get("id"),
                    criteria.getPositionId()
                ));
            }
            
            // Job title filter (case-insensitive partial match)
            if (criteria.getJobTitle() != null && !criteria.getJobTitle().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("position").get("jobTitle")),
                    "%" + criteria.getJobTitle().toLowerCase() + "%"
                ));
            }
            
            // Status filter
            if (criteria.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("status"),
                    criteria.getStatus()
                ));
            }
            
            // Gender filter
            if (criteria.getGender() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("gender"),
                    criteria.getGender()
                ));
            }
            
            // Hire date range filter
            if (criteria.getHireDateStart() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("hireDate"),
                    criteria.getHireDateStart()
                ));
            }
            
            if (criteria.getHireDateEnd() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("hireDate"),
                    criteria.getHireDateEnd()
                ));
            }
            
            // Birth date range filter
            if (criteria.getBirthDateStart() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("birthDate"),
                    criteria.getBirthDateStart()
                ));
            }
            
            if (criteria.getBirthDateEnd() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("birthDate"),
                    criteria.getBirthDateEnd()
                ));
            }
            
            // Phone filter (partial match)
            if (criteria.getPhone() != null && !criteria.getPhone().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    root.get("phone"),
                    "%" + criteria.getPhone() + "%"
                ));
            }
            
            // Address filter (case-insensitive partial match)
            if (criteria.getAddress() != null && !criteria.getAddress().trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("address")),
                    "%" + criteria.getAddress().toLowerCase() + "%"
                ));
            }
            
            // Salary range filter
            if (criteria.getSalaryMin() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                    root.get("salary"),
                    criteria.getSalaryMin()
                ));
            }
            
            if (criteria.getSalaryMax() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                    root.get("salary"),
                    criteria.getSalaryMax()
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Create specification for active employees only
     * 
     * @return specification for active employees
     */
    @SuppressWarnings("unused")
    public static Specification<Employee> isActive() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("status"), Employee.EmployeeStatus.ACTIVE);
    }
    
    /**
     * Create specification for employees in specific department
     * 
     * @param departmentId the department ID
     * @return specification for department filter
     */
    @SuppressWarnings("unused")
    public static Specification<Employee> inDepartment(Long departmentId) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("department").get("id"), departmentId);
    }
    
    /**
     * Create specification for employees with specific position
     * 
     * @param positionId the position ID
     * @return specification for position filter
     */
    @SuppressWarnings("unused")
    public static Specification<Employee> withPosition(Long positionId) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("position").get("id"), positionId);
    }
    
    /**
     * Create specification for employees hired in current year
     * 
     * @return specification for current year hires
     */
    @SuppressWarnings("unused")
    public static Specification<Employee> hiredThisYear() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(
                criteriaBuilder.function("YEAR", Integer.class, root.get("hireDate")),
                java.time.LocalDate.now().getYear()
            );
    }
}