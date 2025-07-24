package com.example.demo.model.dto;

import java.math.BigDecimal;
import java.time.YearMonth;

import com.example.demo.model.entity.PayrollLedger.PayrollStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Search criteria for payroll ledger queries
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollSearchCriteria {
    
    private Long employeeId;
    
    private String employeeName;
    
    private String employeeNumber;
    
    private Long departmentId;
    
    private YearMonth payPeriod;
    
    private YearMonth startPayPeriod;
    
    private YearMonth endPayPeriod;
    
    private PayrollStatus status;
    
    private BigDecimal minNetSalary;
    
    private BigDecimal maxNetSalary;
    
    private Boolean modifiableOnly;
}