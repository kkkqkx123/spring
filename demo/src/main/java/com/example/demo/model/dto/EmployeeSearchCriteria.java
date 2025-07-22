package com.example.demo.model.dto;

import java.time.LocalDate;

import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.Employee.Gender;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for employee search criteria
 * Used for advanced search functionality with multiple filter options
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSearchCriteria {
    
    /**
     * Employee name (partial match, case-insensitive)
     */
    private String name;
    
    /**
     * Employee email (partial match, case-insensitive)
     */
    private String email;
    
    /**
     * Employee number (exact match)
     */
    private String employeeNumber;
    
    /**
     * Department ID filter
     */
    private Long departmentId;
    
    /**
     * Department name (partial match, case-insensitive)
     */
    private String departmentName;
    
    /**
     * Position ID filter
     */
    private Long positionId;
    
    /**
     * Position job title (partial match, case-insensitive)
     */
    private String jobTitle;
    
    /**
     * Employee status filter
     */
    private EmployeeStatus status;
    
    /**
     * Gender filter
     */
    private Gender gender;
    
    /**
     * Hire date range start
     */
    private LocalDate hireDateStart;
    
    /**
     * Hire date range end
     */
    private LocalDate hireDateEnd;
    
    /**
     * Birth date range start
     */
    private LocalDate birthDateStart;
    
    /**
     * Birth date range end
     */
    private LocalDate birthDateEnd;
    
    /**
     * Phone number (partial match)
     */
    private String phone;
    
    /**
     * Address (partial match, case-insensitive)
     */
    private String address;
    
    /**
     * Minimum salary filter
     */
    private Double salaryMin;
    
    /**
     * Maximum salary filter
     */
    private Double salaryMax;
    
    /**
     * Check if any search criteria is provided
     * 
     * @return true if at least one search criterion is provided
     */
    public boolean hasSearchCriteria() {
        return name != null || email != null || employeeNumber != null ||
               departmentId != null || departmentName != null ||
               positionId != null || jobTitle != null ||
               status != null || gender != null ||
               hireDateStart != null || hireDateEnd != null ||
               birthDateStart != null || birthDateEnd != null ||
               phone != null || address != null ||
               salaryMin != null || salaryMax != null;
    }
    
    /**
     * Check if date range is valid
     * 
     * @return true if hire date range is valid
     */
    public boolean isValidHireDateRange() {
        if (hireDateStart == null || hireDateEnd == null) {
            return true;
        }
        return !hireDateStart.isAfter(hireDateEnd);
    }
    
    /**
     * Check if birth date range is valid
     * 
     * @return true if birth date range is valid
     */
    public boolean isValidBirthDateRange() {
        if (birthDateStart == null || birthDateEnd == null) {
            return true;
        }
        return !birthDateStart.isAfter(birthDateEnd);
    }
    
    /**
     * Check if salary range is valid
     * 
     * @return true if salary range is valid
     */
    public boolean isValidSalaryRange() {
        if (salaryMin == null || salaryMax == null) {
            return true;
        }
        return salaryMin <= salaryMax;
    }
}