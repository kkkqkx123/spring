package com.example.demo.model.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Employee entity with comprehensive employee information management
 * Supports full CRUD operations, search functionality, and relationships
 */
@Entity
@Table(name = "employees", indexes = {
    @Index(name = "idx_employee_number", columnList = "employee_number"),
    @Index(name = "idx_employee_name", columnList = "name"),
    @Index(name = "idx_employee_email", columnList = "email"),
    @Index(name = "idx_employee_department", columnList = "department_id"),
    @Index(name = "idx_employee_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"department", "position"})
public class Employee extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Employee status enum
     */
    public enum EmployeeStatus {
        ACTIVE("Active"),
        INACTIVE("Inactive"), 
        ON_LEAVE("On Leave"),
        TERMINATED("Terminated");
        
        private final String displayName;
        
        EmployeeStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * Employee gender enum
     */
    public enum Gender {
        MALE("Male"),
        FEMALE("Female"),
        OTHER("Other");
        
        private final String displayName;
        
        Gender(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Employee number is required")
    @Size(max = 20, message = "Employee number cannot exceed 20 characters")
    @Column(name = "employee_number", unique = true, nullable = false)
    private String employeeNumber;
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Column(nullable = false)
    private String name;
    
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    @Column(unique = true)
    private String email;
    
    @Pattern(regexp = "^[+]?[0-9\\s\\-()]{10,20}$", message = "Phone number format is invalid")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phone;
    
    @NotNull(message = "Department is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = true)
    private Department department;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;
    
    @Past(message = "Hire date must be in the past")
    @Column(name = "hire_date")
    private LocalDate hireDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EmployeeStatus status = EmployeeStatus.ACTIVE;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Size(max = 200, message = "Address cannot exceed 200 characters")
    private String address;
    
    @DecimalMin(value = "0.0", message = "Salary must be non-negative")
    @Column(precision = 10, scale = 2)
    private BigDecimal salary;
    
    @Size(max = 50, message = "Emergency contact name cannot exceed 50 characters")
    @Column(name = "emergency_contact_name")
    private String emergencyContactName;
    
    @Pattern(regexp = "^[+]?[0-9\\s\\-()]{10,20}$", message = "Emergency contact phone format is invalid")
    @Size(max = 20, message = "Emergency contact phone cannot exceed 20 characters")
    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;
    
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
    
    /**
     * Check if the employee is currently active
     * 
     * @return true if employee status is ACTIVE, false otherwise
     */
    public boolean isActive() {
        return EmployeeStatus.ACTIVE.equals(this.status);
    }
    
    /**
     * Get the employee's full display information
     * 
     * @return formatted string with employee number and name
     */
    public String getDisplayName() {
        return String.format("%s - %s", employeeNumber, name);
    }
    
    /**
     * Calculate years of service based on hire date
     * 
     * @return years of service, or 0 if hire date is null
     */
    public int getYearsOfService() {
        if (hireDate == null) {
            return 0;
        }
        return LocalDate.now().getYear() - hireDate.getYear();
    }
}