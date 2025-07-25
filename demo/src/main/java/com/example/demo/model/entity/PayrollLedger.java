package com.example.demo.model.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

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
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * PayrollLedger entity for managing employee payroll information
 * Supports creating, viewing, and modifying payroll ledgers with audit trail
 */
@Entity
@Table(name = "payroll_ledgers", indexes = {
    @Index(name = "idx_payroll_employee", columnList = "employee_id"),
    @Index(name = "idx_payroll_period", columnList = "pay_period"),
    @Index(name = "idx_payroll_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"employee"})
public class PayrollLedger extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Payroll status enum
     */
    public enum PayrollStatus {
        DRAFT("Draft"),
        CALCULATED("Calculated"),
        APPROVED("Approved"),
        PAID("Paid"),
        CANCELLED("Cancelled");
        
        private final String displayName;
        
        PayrollStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Employee is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
    
    @NotNull(message = "Pay period is required")
    @PastOrPresent(message = "Pay period cannot be in the future")
    @Column(name = "pay_period", nullable = false)
    private YearMonth payPeriod;
    
    @NotNull(message = "Base salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Base salary must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Base salary must have at most 10 digits and 2 decimal places")
    @Column(name = "base_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseSalary;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Overtime pay must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Overtime pay must have at most 10 digits and 2 decimal places")
    @Column(name = "overtime_pay", precision = 12, scale = 2)
    private BigDecimal overtimePay;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Bonus must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Bonus must have at most 10 digits and 2 decimal places")
    @Column(precision = 12, scale = 2)
    private BigDecimal bonus;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Allowances must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Allowances must have at most 10 digits and 2 decimal places")
    @Column(precision = 12, scale = 2)
    private BigDecimal allowances;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Tax deductions must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Tax deductions must have at most 10 digits and 2 decimal places")
    @Column(name = "tax_deductions", precision = 12, scale = 2)
    private BigDecimal taxDeductions;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Insurance deductions must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Insurance deductions must have at most 10 digits and 2 decimal places")
    @Column(name = "insurance_deductions", precision = 12, scale = 2)
    private BigDecimal insuranceDeductions;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Other deductions must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Other deductions must have at most 10 digits and 2 decimal places")
    @Column(name = "other_deductions", precision = 12, scale = 2)
    private BigDecimal otherDeductions;
    
    @NotNull(message = "Net salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Net salary must be non-negative")
    @Digits(integer = 10, fraction = 2, message = "Net salary must have at most 10 digits and 2 decimal places")
    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;
    
    @Column(name = "payment_date")
    private LocalDate paymentDate;
    
    @Column(name = "payment_reference")
    private String paymentReference;
    
    @Column(length = 500)
    private String notes;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PayrollStatus status = PayrollStatus.DRAFT;
    
    /**
     * Calculate the gross salary (base salary + overtime + bonus + allowances)
     * 
     * @return the gross salary
     */
    public BigDecimal calculateGrossSalary() {
        BigDecimal gross = baseSalary;
        
        if (overtimePay != null) {
            gross = gross.add(overtimePay);
        }
        
        if (bonus != null) {
            gross = gross.add(bonus);
        }
        
        if (allowances != null) {
            gross = gross.add(allowances);
        }
        
        return gross;
    }
    
    /**
     * Calculate the total deductions (tax + insurance + other)
     * 
     * @return the total deductions
     */
    public BigDecimal calculateTotalDeductions() {
        BigDecimal deductions = BigDecimal.ZERO;
        
        if (taxDeductions != null) {
            deductions = deductions.add(taxDeductions);
        }
        
        if (insuranceDeductions != null) {
            deductions = deductions.add(insuranceDeductions);
        }
        
        if (otherDeductions != null) {
            deductions = deductions.add(otherDeductions);
        }
        
        return deductions;
    }
    
    /**
     * Calculate the net salary (gross salary - total deductions)
     * This method can be used to validate the net salary field
     * 
     * @return the calculated net salary
     */
    public BigDecimal calculateNetSalary() {
        return calculateGrossSalary().subtract(calculateTotalDeductions());
    }
    
    /**
     * Validate the payroll calculations
     * 
     * @return true if the net salary matches the calculated value, false otherwise
     */
    public boolean validateCalculations() {
        if (netSalary == null) {
            return false;
        }
        
        BigDecimal calculatedNet = calculateNetSalary();
        return netSalary.compareTo(calculatedNet) == 0;
    }
    
    /**
     * Get the formatted pay period string (YYYY-MM)
     * 
     * @return formatted pay period string
     */
    public String getFormattedPayPeriod() {
        if (payPeriod == null) {
            return null;
        }
        return payPeriod.toString();
    }
    
    /**
     * Check if the payroll ledger is in a modifiable state
     * 
     * @return true if the ledger can be modified, false otherwise
     */
    public boolean isModifiable() {
        return status == PayrollStatus.DRAFT || status == PayrollStatus.CALCULATED;
    }
    
    /**
     * Constructor with required fields for creating a new payroll ledger
     * 
     * @param employee the employee associated with this payroll
     * @param payPeriod the pay period for this payroll
     * @param baseSalary the base salary for this payroll
     * @param netSalary the net salary for this payroll
     */
    public PayrollLedger(Employee employee, YearMonth payPeriod, BigDecimal baseSalary, BigDecimal netSalary) {
        this.employee = employee;
        this.payPeriod = payPeriod;
        this.baseSalary = baseSalary;
        this.netSalary = netSalary;
        this.status = PayrollStatus.DRAFT;
    }
    
    /**
     * Constructor with all fields
     * 
     * @param employee the employee associated with this payroll
     * @param payPeriod the pay period for this payroll
     * @param baseSalary the base salary for this payroll
     * @param overtimePay the overtime pay for this payroll
     * @param bonus the bonus for this payroll
     * @param allowances the allowances for this payroll
     * @param taxDeductions the tax deductions for this payroll
     * @param insuranceDeductions the insurance deductions for this payroll
     * @param otherDeductions the other deductions for this payroll
     * @param netSalary the net salary for this payroll
     * @param paymentDate the payment date for this payroll
     * @param paymentReference the payment reference for this payroll
     * @param notes the notes for this payroll
     * @param status the status of this payroll
     */
    public PayrollLedger(Employee employee, YearMonth payPeriod, BigDecimal baseSalary, BigDecimal overtimePay,
            BigDecimal bonus, BigDecimal allowances, BigDecimal taxDeductions, BigDecimal insuranceDeductions,
            BigDecimal otherDeductions, BigDecimal netSalary, LocalDate paymentDate, String paymentReference,
            String notes, PayrollStatus status) {
        this.employee = employee;
        this.payPeriod = payPeriod;
        this.baseSalary = baseSalary;
        this.overtimePay = overtimePay;
        this.bonus = bonus;
        this.allowances = allowances;
        this.taxDeductions = taxDeductions;
        this.insuranceDeductions = insuranceDeductions;
        this.otherDeductions = otherDeductions;
        this.netSalary = netSalary;
        this.paymentDate = paymentDate;
        this.paymentReference = paymentReference;
        this.notes = notes;
        this.status = status;
    }
    
    /**
     * Sets the employee and updates the last modified timestamp
     * 
     * @param employee the employee to set
     */
    public void setEmployee(Employee employee) {
        this.employee = employee;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the pay period and updates the last modified timestamp
     * 
     * @param payPeriod the pay period to set
     */
    public void setPayPeriod(YearMonth payPeriod) {
        this.payPeriod = payPeriod;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the base salary and updates the last modified timestamp
     * 
     * @param baseSalary the base salary to set
     */
    public void setBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the overtime pay and updates the last modified timestamp
     * 
     * @param overtimePay the overtime pay to set
     */
    public void setOvertimePay(BigDecimal overtimePay) {
        this.overtimePay = overtimePay;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the bonus and updates the last modified timestamp
     * 
     * @param bonus the bonus to set
     */
    public void setBonus(BigDecimal bonus) {
        this.bonus = bonus;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the allowances and updates the last modified timestamp
     * 
     * @param allowances the allowances to set
     */
    public void setAllowances(BigDecimal allowances) {
        this.allowances = allowances;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the tax deductions and updates the last modified timestamp
     * 
     * @param taxDeductions the tax deductions to set
     */
    public void setTaxDeductions(BigDecimal taxDeductions) {
        this.taxDeductions = taxDeductions;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the insurance deductions and updates the last modified timestamp
     * 
     * @param insuranceDeductions the insurance deductions to set
     */
    public void setInsuranceDeductions(BigDecimal insuranceDeductions) {
        this.insuranceDeductions = insuranceDeductions;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the other deductions and updates the last modified timestamp
     * 
     * @param otherDeductions the other deductions to set
     */
    public void setOtherDeductions(BigDecimal otherDeductions) {
        this.otherDeductions = otherDeductions;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the net salary and updates the last modified timestamp
     * 
     * @param netSalary the net salary to set
     */
    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the payment date and updates the last modified timestamp
     * 
     * @param paymentDate the payment date to set
     */
    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the payment reference and updates the last modified timestamp
     * 
     * @param paymentReference the payment reference to set
     */
    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the notes and updates the last modified timestamp
     * 
     * @param notes the notes to set
     */
    public void setNotes(String notes) {
        this.notes = notes;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Sets the status and updates the last modified timestamp
     * 
     * @param status the status to set
     */
    public void setStatus(PayrollStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Sets the employee ID by creating a new Employee object with the given ID
     * and updates the last modified timestamp
     * 
     * @param employeeId the employee ID to set
     */
    public void setEmployeeId(Long employeeId) {
        if (employeeId != null) {
            Employee emp = new Employee();
            emp.setId(employeeId);
            this.employee = emp;
        } else {
            this.employee = null;
        }
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Sets various deduction fields to the same value and updates the last modified timestamp
     * 
     * @param deductions the deduction amount to set for all deduction fields
     */
    public void setDeductions(BigDecimal deductions) {
        this.taxDeductions = deductions;
        this.insuranceDeductions = deductions;
        this.otherDeductions = deductions;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Sets the pay period from a LocalDate and updates the last modified timestamp
     * 
     * @param date the date to set as pay period
     */
    public void setPayPeriod(LocalDate date) {
        if (date != null) {
            this.payPeriod = YearMonth.from(date);
        } else {
            this.payPeriod = null;
        }
        this.updatedAt = LocalDateTime.now();
    }
}