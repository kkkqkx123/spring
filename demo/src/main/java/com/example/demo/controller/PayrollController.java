package com.example.demo.controller;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PayrollSearchCriteria;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;
import com.example.demo.service.PayrollService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for payroll management operations
 */
@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
@Slf4j
public class PayrollController {

    private final PayrollService payrollService;
    
    /**
     * Get all payroll ledgers with pagination
     * 
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PAYROLL_MANAGER') or hasRole('HR_MANAGER') or hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Page<PayrollLedgerDTO>> getAllPayrollLedgers(
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        log.info("REST request to get all payroll ledgers with pagination");
        Page<PayrollLedgerDTO> payrollLedgers = payrollService.getAllPayrollLedgers(pageable);
        return ResponseEntity.ok(payrollLedgers);
    }
    
    /**
     * Get payroll ledger by ID
     * 
     * @param id the payroll ledger ID
     * @return the payroll ledger
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<PayrollLedgerDTO> getPayrollLedger(@PathVariable Long id) {
        log.info("REST request to get payroll ledger by ID: {}", id);
        PayrollLedgerDTO payrollLedger = payrollService.getPayrollLedger(id);
        return ResponseEntity.ok(payrollLedger);
    }
    
    /**
     * Create a new payroll ledger
     * 
     * @param payrollLedgerDTO the payroll ledger to create
     * @return the created payroll ledger
     */
    @PostMapping
    @PreAuthorize("hasAuthority('PAYROLL_CREATE')")
    public ResponseEntity<PayrollLedgerDTO> createPayrollLedger(
            @Valid @RequestBody PayrollLedgerDTO payrollLedgerDTO) {
        log.info("REST request to create payroll ledger for employee ID: {}, pay period: {}", 
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod());
        PayrollLedgerDTO createdPayrollLedger = payrollService.createPayrollLedger(payrollLedgerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPayrollLedger);
    }
    
    /**
     * Update an existing payroll ledger
     * 
     * @param id the payroll ledger ID
     * @param payrollLedgerDTO the updated payroll ledger details
     * @return the updated payroll ledger
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PAYROLL_UPDATE')")
    public ResponseEntity<PayrollLedgerDTO> updatePayrollLedger(
            @PathVariable Long id, @Valid @RequestBody PayrollLedgerDTO payrollLedgerDTO) {
        log.info("REST request to update payroll ledger with ID: {}", id);
        PayrollLedgerDTO updatedPayrollLedger = payrollService.updatePayrollLedger(id, payrollLedgerDTO);
        return ResponseEntity.ok(updatedPayrollLedger);
    }
    
    /**
     * Delete a payroll ledger by ID
     * 
     * @param id the payroll ledger ID
     * @return no content response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PAYROLL_DELETE')")
    public ResponseEntity<Void> deletePayrollLedger(@PathVariable Long id) {
        log.info("REST request to delete payroll ledger with ID: {}", id);
        payrollService.deletePayrollLedger(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search payroll ledgers by criteria with pagination
     * 
     * @param criteria the search criteria
     * @param pageable pagination information
     * @return page of payroll ledgers matching criteria
     */
    @PostMapping("/search")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Page<PayrollLedgerDTO>> searchPayrollLedgers(
            @RequestBody PayrollSearchCriteria criteria,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        log.info("REST request to search payroll ledgers with criteria: {}", criteria);
        Page<PayrollLedgerDTO> payrollLedgers = payrollService.searchPayrollLedgers(criteria, pageable);
        return ResponseEntity.ok(payrollLedgers);
    }
    
    /**
     * Get payroll ledgers for an employee
     * 
     * @param employeeId the employee ID
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Page<PayrollLedgerDTO>> getPayrollLedgersByEmployee(
            @PathVariable Long employeeId,
            @PageableDefault(size = 10, sort = "payPeriod", direction = org.springframework.data.domain.Sort.Direction.DESC) 
            Pageable pageable) {
        log.info("REST request to get payroll ledgers for employee ID: {}", employeeId);
        Page<PayrollLedgerDTO> payrollLedgers = payrollService.getPayrollLedgersByEmployee(employeeId, pageable);
        return ResponseEntity.ok(payrollLedgers);
    }
    
    /**
     * Get payroll ledgers for a pay period
     * 
     * @param year the year
     * @param month the month
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    @GetMapping("/period/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Page<PayrollLedgerDTO>> getPayrollLedgersByPayPeriod(
            @PathVariable int year,
            @PathVariable int month,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        log.info("REST request to get payroll ledgers for pay period: {}-{}", year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        Page<PayrollLedgerDTO> payrollLedgers = payrollService.getPayrollLedgersByPayPeriod(payPeriod, pageable);
        return ResponseEntity.ok(payrollLedgers);
    }
    
    /**
     * Get payroll ledgers for a department
     * 
     * @param departmentId the department ID
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Page<PayrollLedgerDTO>> getPayrollLedgersByDepartment(
            @PathVariable Long departmentId,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        log.info("REST request to get payroll ledgers for department ID: {}", departmentId);
        Page<PayrollLedgerDTO> payrollLedgers = payrollService.getPayrollLedgersByDepartment(departmentId, pageable);
        return ResponseEntity.ok(payrollLedgers);
    }
    
    /**
     * Calculate payroll values
     * 
     * @param payrollLedgerDTO the payroll ledger data
     * @return the calculated payroll ledger
     */
    @PostMapping("/calculate")
    @PreAuthorize("hasAuthority('PAYROLL_UPDATE')")
    public ResponseEntity<PayrollLedgerDTO> calculatePayroll(
            @Valid @RequestBody PayrollLedgerDTO payrollLedgerDTO) {
        log.info("REST request to calculate payroll for employee ID: {}, pay period: {}", 
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod());
        PayrollLedgerDTO calculatedPayrollLedger = payrollService.calculatePayroll(payrollLedgerDTO);
        return ResponseEntity.ok(calculatedPayrollLedger);
    }
    
    /**
     * Validate payroll calculations
     * 
     * @param payrollLedgerDTO the payroll ledger data
     * @return validation result
     */
    @PostMapping("/validate")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Map<String, Boolean>> validatePayrollCalculations(
            @Valid @RequestBody PayrollLedgerDTO payrollLedgerDTO) {
        log.info("REST request to validate payroll calculations for employee ID: {}, pay period: {}", 
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod());
        boolean isValid = payrollService.validatePayrollCalculations(payrollLedgerDTO);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
    
    /**
     * Update payroll status
     * 
     * @param id the payroll ledger ID
     * @param status the new status
     * @return the updated payroll ledger
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PAYROLL_UPDATE')")
    public ResponseEntity<PayrollLedgerDTO> updatePayrollStatus(
            @PathVariable Long id, @RequestParam PayrollStatus status) {
        log.info("REST request to update payroll ledger status to {} for ID: {}", status, id);
        PayrollLedgerDTO updatedPayrollLedger = payrollService.updatePayrollStatus(id, status);
        return ResponseEntity.ok(updatedPayrollLedger);
    }
    
    /**
     * Process payment for a payroll ledger
     * 
     * @param id the payroll ledger ID
     * @param paymentReference the payment reference
     * @return the updated payroll ledger
     */
    @PutMapping("/{id}/payment")
    @PreAuthorize("hasAuthority('PAYROLL_UPDATE')")
    public ResponseEntity<PayrollLedgerDTO> processPayment(
            @PathVariable Long id, @RequestParam String paymentReference) {
        log.info("REST request to process payment for payroll ledger ID: {} with reference: {}", 
                id, paymentReference);
        PayrollLedgerDTO updatedPayrollLedger = payrollService.processPayment(id, paymentReference);
        return ResponseEntity.ok(updatedPayrollLedger);
    }
    
    /**
     * Get payroll statistics by department for a pay period
     * 
     * @param year the year
     * @param month the month
     * @return list of department statistics
     */
    @GetMapping("/stats/department/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<List<Map<String, Object>>> getPayrollStatsByDepartment(
            @PathVariable int year, @PathVariable int month) {
        log.info("REST request to get payroll statistics by department for period: {}-{}", year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        List<Map<String, Object>> stats = payrollService.getPayrollStatsByDepartment(payPeriod);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get payroll statistics by status for a pay period
     * 
     * @param year the year
     * @param month the month
     * @return list of status statistics
     */
    @GetMapping("/stats/status/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<List<Map<String, Object>>> getPayrollStatsByStatus(
            @PathVariable int year, @PathVariable int month) {
        log.info("REST request to get payroll statistics by status for period: {}-{}", year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        List<Map<String, Object>> stats = payrollService.getPayrollStatsByStatus(payPeriod);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get total payroll amount for a pay period
     * 
     * @param year the year
     * @param month the month
     * @return total net salary
     */
    @GetMapping("/total/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Map<String, BigDecimal>> getTotalPayrollAmount(
            @PathVariable int year, @PathVariable int month) {
        log.info("REST request to get total payroll amount for period: {}-{}", year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        BigDecimal total = payrollService.getTotalPayrollAmount(payPeriod);
        return ResponseEntity.ok(Map.of("totalAmount", total));
    }
    
    /**
     * Get total payroll amount for a department and pay period
     * 
     * @param departmentId the department ID
     * @param year the year
     * @param month the month
     * @return total net salary
     */
    @GetMapping("/total/department/{departmentId}/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_READ')")
    public ResponseEntity<Map<String, BigDecimal>> getTotalPayrollAmountByDepartment(
            @PathVariable Long departmentId, @PathVariable int year, @PathVariable int month) {
        log.info("REST request to get total payroll amount for department ID: {} and period: {}-{}", 
                departmentId, year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        BigDecimal total = payrollService.getTotalPayrollAmountByDepartment(departmentId, payPeriod);
        return ResponseEntity.ok(Map.of("totalAmount", total));
    }
    
    /**
     * Generate payroll ledgers for all active employees for a pay period
     * 
     * @param year the year
     * @param month the month
     * @return list of generated payroll ledgers
     */
    @PostMapping("/generate/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_CREATE')")
    public ResponseEntity<List<PayrollLedgerDTO>> generatePayrollLedgers(
            @PathVariable int year, @PathVariable int month) {
        log.info("REST request to generate payroll ledgers for period: {}-{}", year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        List<PayrollLedgerDTO> generatedLedgers = payrollService.generatePayrollLedgers(payPeriod);
        return ResponseEntity.status(HttpStatus.CREATED).body(generatedLedgers);
    }
    
    /**
     * Generate payroll ledger for an employee for a pay period
     * 
     * @param employeeId the employee ID
     * @param year the year
     * @param month the month
     * @return the generated payroll ledger
     */
    @PostMapping("/generate/employee/{employeeId}/{year}/{month}")
    @PreAuthorize("hasAuthority('PAYROLL_CREATE')")
    public ResponseEntity<PayrollLedgerDTO> generatePayrollLedger(
            @PathVariable Long employeeId, @PathVariable int year, @PathVariable int month) {
        log.info("REST request to generate payroll ledger for employee ID: {} and period: {}-{}", 
                employeeId, year, month);
        YearMonth payPeriod = YearMonth.of(year, month);
        PayrollLedgerDTO generatedLedger = payrollService.generatePayrollLedger(employeeId, payPeriod);
        return ResponseEntity.status(HttpStatus.CREATED).body(generatedLedger);
    }
}