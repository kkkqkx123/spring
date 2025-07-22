package com.example.demo.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object for Position entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PositionDto {
    
    private Long id;
    
    @NotBlank(message = "Job title is required")
    @Size(min = 2, max = 100, message = "Job title must be between 2 and 100 characters")
    private String jobTitle;
    
    @Size(max = 100, message = "Professional title cannot exceed 100 characters")
    private String professionalTitle;
    
    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
    
    @NotNull(message = "Department is required")
    private Long departmentId;
    
    private String departmentName;
    
    private Double salaryMin;
    
    private Double salaryMax;
    
    private Boolean isActive = true;
    
    private int employeeCount;
    
    /**
     * Constructor with essential fields
     */
    public PositionDto(Long id, String jobTitle, String professionalTitle, Long departmentId) {
        this.id = id;
        this.jobTitle = jobTitle;
        this.professionalTitle = professionalTitle;
        this.departmentId = departmentId;
    }
}