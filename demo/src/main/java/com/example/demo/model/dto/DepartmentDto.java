package com.example.demo.model.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object for Department entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDto {
    
    private Long id;
    
    @NotBlank(message = "Department name is required")
    @Size(min = 2, max = 100, message = "Department name must be between 2 and 100 characters")
    private String name;
    
    private Long parentId;
    
    private String parentName;
    
    private Boolean isParent = false;
    
    private String depPath;
    
    private List<DepartmentDto> children = new ArrayList<>();
    
    private int employeeCount;
    
    /**
     * Constructor with essential fields
     */
    public DepartmentDto(Long id, String name, Long parentId, Boolean isParent) {
        this.id = id;
        this.name = name;
        this.parentId = parentId;
        this.isParent = isParent;
    }
}