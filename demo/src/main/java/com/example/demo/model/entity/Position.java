package com.example.demo.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Position entity representing job positions within the organization
 * Contains job title and professional title information
 */
@Entity
@Table(name = "positions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"department", "employees"})
public class Position extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Job title is required")
    @Size(min = 2, max = 100, message = "Job title must be between 2 and 100 characters")
    @Column(name = "job_title", unique = true)
    private String jobTitle;
    
    @Size(max = 100, message = "Professional title cannot exceed 100 characters")
    @Column(name = "professional_title")
    private String professionalTitle;
    
    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
    
    @NotNull(message = "Department is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;
    
    /**
     * Salary range minimum for this position
     */
    @Column(name = "salary_min")
    private Double salaryMin;
    
    /**
     * Salary range maximum for this position
     */
    @Column(name = "salary_max")
    private Double salaryMax;
    
    /**
     * Flag indicating if this position is active
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * Employees with this position (transient to avoid circular references)
     */
    @OneToMany(mappedBy = "position", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Employee> employees = new ArrayList<>();
    
    /**
     * Check if the position has any assigned employees
     * 
     * @return true if the position has employees, false otherwise
     */
    public boolean hasEmployees() {
        return employees != null && !employees.isEmpty();
    }
    
    /**
     * Check if the salary range is valid
     * 
     * @return true if the salary range is valid, false otherwise
     */
    public boolean isValidSalaryRange() {
        if (salaryMin == null || salaryMax == null) {
            return true; // No validation needed if either is null
        }
        return salaryMin <= salaryMax;
    }
}