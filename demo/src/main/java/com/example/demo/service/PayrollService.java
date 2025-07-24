package com.example.demo.service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PayrollSearchCriteria;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;

/**
 * Service interface for payroll management operations
 */
public interface PayrollService {
    
    /**
     * Create a new payroll ledger
     * 
     * @param payrollLedgerDTO the payroll ledger data
     * @return the created payroll ledger
     */
    PayrollLedgerDTO createPayrollLedger(PayrollLedgerDTO payrollLedgerDTO);
    
    /**
     * Get a payroll ledger by ID
     * 
     * @param id the payroll ledger ID
     * @return the payroll ledger
     */
    PayrollLedgerDTO getPayrollLedger(Long id);
    
    /**
     * Update an existing payroll ledger
     * 
     * @param id the payroll ledger ID
     * @param payrollLedgerDTO the updated payroll ledger data
     * @return the updated payroll ledger
     */
    PayrollLedgerDTO updatePayrollLedger(Long id, PayrollLedgerDTO payrollLedgerDTO);
    
    /**
     * Delete a payroll ledger
     * 
     * @param id the payroll ledger ID
     */
    void deletePayrollLedger(Long id);
    
    /**
     * Get all payroll ledgers with pagination
     * 
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedgerDTO> getAllPayrollLedgers(Pageable pageable);
    
    /**
     * Search payroll ledgers with criteria
     * 
     * @param criteria the search criteria
     * @param pageable pagination information
     * @return page of matching payroll ledgers
     */
    Page<PayrollLedgerDTO> searchPayrollLedgers(PayrollSearchCriteria criteria, Pageable pageable);
    
    /**
     * Get payroll ledgers for an employee
     * 
     * @param employeeId the employee ID
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedgerDTO> getPayrollLedgersByEmployee(Long employeeId, Pageable pageable);
    
    /**
     * Get payroll ledgers for a pay period
     * 
     * @param payPeriod the pay period
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedgerDTO> getPayrollLedgersByPayPeriod(YearMonth payPeriod, Pageable pageable);
    
    /**
     * Get payroll ledgers for a department
     * 
     * @param departmentId the department ID
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedgerDTO> getPayrollLedgersByDepartment(Long departmentId, Pageable pageable);
    
    /**
     * Calculate payroll ledger values
     * 
     * @param payrollLedgerDTO the payroll ledger data
     * @return the calculated payroll ledger
     */
    PayrollLedgerDTO calculatePayroll(PayrollLedgerDTO payrollLedgerDTO);
    
    /**
     * Validate payroll calculations
     * 
     * @param payrollLedgerDTO the payroll ledger data
     * @return true if calculations are valid, false otherwise
     */
    boolean validatePayrollCalculations(PayrollLedgerDTO payrollLedgerDTO);
    
    /**
     * Update payroll ledger status
     * 
     * @param id the payroll ledger ID
     * @param status the new status
     * @return the updated payroll ledger
     */
    PayrollLedgerDTO updatePayrollStatus(Long id, PayrollStatus status);
    
    /**
     * Process payment for a payroll ledger
     * 
     * @param id the payroll ledger ID
     * @param paymentReference the payment reference
     * @return the updated payroll ledger
     */
    PayrollLedgerDTO processPayment(Long id, String paymentReference);
    
    /**
     * Get payroll statistics by department for a pay period
     * 
     * @param payPeriod the pay period
     * @return map of department statistics
     */
    List<Map<String, Object>> getPayrollStatsByDepartment(YearMonth payPeriod);
    
    /**
     * Get payroll statistics by status for a pay period
     * 
     * @param payPeriod the pay period
     * @return map of status statistics
     */
    List<Map<String, Object>> getPayrollStatsByStatus(YearMonth payPeriod);
    
    /**
     * Get total payroll amount for a pay period
     * 
     * @param payPeriod the pay period
     * @return total net salary
     */
    BigDecimal getTotalPayrollAmount(YearMonth payPeriod);
    
    /**
     * Get total payroll amount for a department and pay period
     * 
     * @param departmentId the department ID
     * @param payPeriod the pay period
     * @return total net salary
     */
    BigDecimal getTotalPayrollAmountByDepartment(Long departmentId, YearMonth payPeriod);
    
    /**
     * Generate payroll ledgers for all active employees for a pay period
     * 
     * @param payPeriod the pay period
     * @return list of generated payroll ledgers
     */
    List<PayrollLedgerDTO> generatePayrollLedgers(YearMonth payPeriod);
    
    /**
     * Generate payroll ledger for an employee for a pay period
     * 
     * @param employeeId the employee ID
     * @param payPeriod the pay period
     * @return the generated payroll ledger
     */
    PayrollLedgerDTO generatePayrollLedger(Long employeeId, YearMonth payPeriod);
}