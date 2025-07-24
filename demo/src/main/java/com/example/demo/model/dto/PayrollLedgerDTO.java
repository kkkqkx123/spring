package com.example.demo.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import com.example.demo.model.entity.PayrollLedger.PayrollStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for PayrollLedger entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollLedgerDTO {
    
    private Long id;
    
    @NotNull(message = "Employee ID is required")
    private Long employeeId;
    
    private String employeeName;
    
    private String employeeNumber;
    
    private Long departmentId;
    
    private String departmentName;
    
    @NotNull(message = "Pay period is required")
    private YearMonth payPeriod;
    
    private String formattedPayPeriod;
    
    @NotNull(message = "Base salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Base salary must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Base salary must have at most 10 digits and 2 decimal places")
    private BigDecimal baseSalary;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Overtime pay must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Overtime pay must have at most 10 digits and 2 decimal places")
    private BigDecimal overtimePay;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Bonus must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Bonus must have at most 10 digits and 2 decimal places")
    private BigDecimal bonus;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Allowances must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Allowances must have at most 10 digits and 2 decimal places")
    private BigDecimal allowances;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Tax deductions must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Tax deductions must have at most 10 digits and 2 decimal places")
    private BigDecimal taxDeductions;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Insurance deductions must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Insurance deductions must have at most 10 digits and 2 decimal places")
    private BigDecimal insuranceDeductions;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Other deductions must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Other deductions must have at most 10 digits and 2 decimal places")
    private BigDecimal otherDeductions;
    
    @NotNull(message = "Net salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Net salary must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Net salary must have at most 10 digits and 2 decimal places")
    private BigDecimal netSalary;
    
    private BigDecimal grossSalary;
    
    private BigDecimal totalDeductions;
    
    @PastOrPresent(message = "Payment date cannot be in the future")
    private LocalDate paymentDate;
    
    private String paymentReference;
    
    private String notes;
    
    private PayrollStatus status;
    
    private String statusDisplayName;
    
    private String createdBy;
    
    private String updatedBy;
    
    private LocalDate createdAt;
    
    private LocalDate updatedAt;
    
    private boolean modifiable;
}