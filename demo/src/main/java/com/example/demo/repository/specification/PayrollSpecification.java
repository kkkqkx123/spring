package com.example.demo.repository.specification;

import java.math.BigDecimal;
import java.time.YearMonth;

import org.springframework.data.jpa.domain.Specification;

import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;

/**
 * Specification class for PayrollLedger entity
 * Provides methods for building dynamic queries
 */
public class PayrollSpecification {

    private PayrollSpecification() {
        // Private constructor to prevent instantiation
    }
    
    /**
     * Filter by employee ID
     * 
     * @param employeeId the employee ID
     * @return specification for employee ID filter
     */
    public static Specification<PayrollLedger> hasEmployeeId(Long employeeId) {
        return (root, query, criteriaBuilder) -> {
            if (employeeId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("employee").get("id"), employeeId);
        };
    }
    
    /**
     * Filter by department ID
     * 
     * @param departmentId the department ID
     * @return specification for department ID filter
     */
    public static Specification<PayrollLedger> inDepartment(Long departmentId) {
        return (root, query, criteriaBuilder) -> {
            if (departmentId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("employee").get("department").get("id"), departmentId);
        };
    }
    
    /**
     * Filter by pay period
     * 
     * @param payPeriod the pay period
     * @return specification for pay period filter
     */
    public static Specification<PayrollLedger> hasPayPeriod(YearMonth payPeriod) {
        return (root, query, criteriaBuilder) -> {
            if (payPeriod == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("payPeriod"), payPeriod);
        };
    }
    
    /**
     * Filter by payroll status
     * 
     * @param status the payroll status
     * @return specification for status filter
     */
    public static Specification<PayrollLedger> hasStatus(PayrollStatus status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }
    
    /**
     * Filter by minimum net salary
     * 
     * @param minNetSalary the minimum net salary
     * @return specification for minimum net salary filter
     */
    public static Specification<PayrollLedger> hasMinNetSalary(BigDecimal minNetSalary) {
        return (root, query, criteriaBuilder) -> {
            if (minNetSalary == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.greaterThanOrEqualTo(root.get("netSalary"), minNetSalary);
        };
    }
    
    /**
     * Filter by maximum net salary
     * 
     * @param maxNetSalary the maximum net salary
     * @return specification for maximum net salary filter
     */
    public static Specification<PayrollLedger> hasMaxNetSalary(BigDecimal maxNetSalary) {
        return (root, query, criteriaBuilder) -> {
            if (maxNetSalary == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("netSalary"), maxNetSalary);
        };
    }
    
    /**
     * Filter for draft payroll ledgers
     * 
     * @return specification for draft status filter
     */
    public static Specification<PayrollLedger> isDraft() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("status"), PayrollStatus.DRAFT);
    }
    
    /**
     * Filter for approved payroll ledgers
     * 
     * @return specification for approved status filter
     */
    public static Specification<PayrollLedger> isApproved() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("status"), PayrollStatus.APPROVED);
    }
    
    /**
     * Filter for paid payroll ledgers
     * 
     * @return specification for paid status filter
     */
    public static Specification<PayrollLedger> isPaid() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("status"), PayrollStatus.PAID);
    }
    
    /**
     * Filter for modifiable payroll ledgers (draft or calculated)
     * 
     * @return specification for modifiable status filter
     */
    public static Specification<PayrollLedger> isModifiable() {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.or(
                criteriaBuilder.equal(root.get("status"), PayrollStatus.DRAFT),
                criteriaBuilder.equal(root.get("status"), PayrollStatus.CALCULATED)
            );
    }
}