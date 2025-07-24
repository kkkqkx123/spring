package com.example.demo.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.exception.PayrollCalculationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PayrollSearchCriteria;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.PayrollRepository;
import com.example.demo.repository.specification.PayrollSpecification;
import com.example.demo.service.PayrollService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of PayrollService interface
 */
@Service
@Slf4j
public class PayrollServiceImpl implements PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollServiceImpl(PayrollRepository payrollRepository, EmployeeRepository employeeRepository) {
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional
    public PayrollLedgerDTO createPayrollLedger(PayrollLedgerDTO payrollLedgerDTO) {
        log.info("Creating payroll ledger for employee ID: {}, pay period: {}", 
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod());
        
        // Check if payroll ledger already exists for employee and pay period
        if (payrollRepository.existsByEmployeeIdAndPayPeriod(
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod())) {
            throw new IllegalStateException("Payroll ledger already exists for employee ID: " + 
                    payrollLedgerDTO.getEmployeeId() + " and pay period: " + payrollLedgerDTO.getPayPeriod());
        }
        
        // Find employee
        Employee employee = employeeRepository.findById(payrollLedgerDTO.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + 
                        payrollLedgerDTO.getEmployeeId()));
        
        // Create and save payroll ledger
        PayrollLedger payrollLedger = convertToEntity(payrollLedgerDTO);
        payrollLedger.setEmployee(employee);
        
        // Calculate and validate payroll
        calculatePayrollValues(payrollLedger);
        validatePayrollCalculations(payrollLedger);
        
        // Save entity
        PayrollLedger savedPayrollLedger = payrollRepository.save(payrollLedger);
        
        return convertToDTO(savedPayrollLedger);
    }

    @Override
    @Transactional(readOnly = true)
    public PayrollLedgerDTO getPayrollLedger(Long id) {
        log.info("Getting payroll ledger with ID: {}", id);
        
        PayrollLedger payrollLedger = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll ledger not found with ID: " + id));
        
        return convertToDTO(payrollLedger);
    }

    @Override
    @Transactional
    public PayrollLedgerDTO updatePayrollLedger(Long id, PayrollLedgerDTO payrollLedgerDTO) {
        log.info("Updating payroll ledger with ID: {}", id);
        
        PayrollLedger existingPayrollLedger = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll ledger not found with ID: " + id));
        
        // Check if payroll ledger is modifiable
        if (!existingPayrollLedger.isModifiable()) {
            throw new IllegalStateException("Payroll ledger with ID: " + id + 
                    " cannot be modified in status: " + existingPayrollLedger.getStatus());
        }
        
        // Update fields
        updatePayrollLedgerFields(existingPayrollLedger, payrollLedgerDTO);
        
        // Calculate and validate payroll
        calculatePayrollValues(existingPayrollLedger);
        validatePayrollCalculations(existingPayrollLedger);
        
        // Save updated entity
        PayrollLedger updatedPayrollLedger = payrollRepository.save(existingPayrollLedger);
        
        return convertToDTO(updatedPayrollLedger);
    }

    @Override
    @Transactional
    public void deletePayrollLedger(Long id) {
        log.info("Deleting payroll ledger with ID: {}", id);
        
        PayrollLedger payrollLedger = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll ledger not found with ID: " + id));
        
        // Check if payroll ledger is in DRAFT status
        if (payrollLedger.getStatus() != PayrollStatus.DRAFT) {
            throw new IllegalStateException("Cannot delete payroll ledger with ID: " + id + 
                    " in status: " + payrollLedger.getStatus() + ". Only DRAFT ledgers can be deleted.");
        }
        
        payrollRepository.delete(payrollLedger);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollLedgerDTO> getAllPayrollLedgers(Pageable pageable) {
        log.info("Getting all payroll ledgers with pagination");
        
        return payrollRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollLedgerDTO> searchPayrollLedgers(PayrollSearchCriteria criteria, Pageable pageable) {
        log.info("Searching payroll ledgers with criteria: {}", criteria);
        
        Specification<PayrollLedger> spec = buildSpecificationFromCriteria(criteria);
        
        return payrollRepository.findAll(spec, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollLedgerDTO> getPayrollLedgersByEmployee(Long employeeId, Pageable pageable) {
        log.info("Getting payroll ledgers for employee ID: {}", employeeId);
        
        // Check if employee exists
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with ID: " + employeeId);
        }
        
        return payrollRepository.findByEmployeeId(employeeId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollLedgerDTO> getPayrollLedgersByPayPeriod(YearMonth payPeriod, Pageable pageable) {
        log.info("Getting payroll ledgers for pay period: {}", payPeriod);
        
        return payrollRepository.findByPayPeriod(payPeriod, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollLedgerDTO> getPayrollLedgersByDepartment(Long departmentId, Pageable pageable) {
        log.info("Getting payroll ledgers for department ID: {}", departmentId);
        
        return payrollRepository.findByEmployeeDepartmentId(departmentId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional
    public PayrollLedgerDTO calculatePayroll(PayrollLedgerDTO payrollLedgerDTO) {
        log.info("Calculating payroll for employee ID: {}, pay period: {}", 
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod());
        
        // Convert to entity for calculation
        PayrollLedger payrollLedger = convertToEntity(payrollLedgerDTO);
        
        // Calculate values
        calculatePayrollValues(payrollLedger);
        
        // Convert back to DTO with calculated values
        PayrollLedgerDTO calculatedDTO = convertToDTO(payrollLedger);
        calculatedDTO.setStatus(PayrollStatus.CALCULATED);
        
        return calculatedDTO;
    }

    @Override
    public boolean validatePayrollCalculations(PayrollLedgerDTO payrollLedgerDTO) {
        log.info("Validating payroll calculations for employee ID: {}, pay period: {}", 
                payrollLedgerDTO.getEmployeeId(), payrollLedgerDTO.getPayPeriod());
        
        // Convert to entity for validation
        PayrollLedger payrollLedger = convertToEntity(payrollLedgerDTO);
        
        try {
            validatePayrollCalculations(payrollLedger);
            return true;
        } catch (PayrollCalculationException e) {
            log.warn("Payroll validation failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public PayrollLedgerDTO updatePayrollStatus(Long id, PayrollStatus status) {
        log.info("Updating payroll ledger status to {} for ID: {}", status, id);
        
        PayrollLedger payrollLedger = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll ledger not found with ID: " + id));
        
        // Validate status transition
        validateStatusTransition(payrollLedger.getStatus(), status);
        
        // Update status
        payrollLedger.setStatus(status);
        
        // If status is APPROVED, validate calculations
        if (status == PayrollStatus.APPROVED) {
            validatePayrollCalculations(payrollLedger);
        }
        
        PayrollLedger updatedPayrollLedger = payrollRepository.save(payrollLedger);
        
        return convertToDTO(updatedPayrollLedger);
    }

    @Override
    @Transactional
    public PayrollLedgerDTO processPayment(Long id, String paymentReference) {
        log.info("Processing payment for payroll ledger ID: {} with reference: {}", id, paymentReference);
        
        PayrollLedger payrollLedger = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll ledger not found with ID: " + id));
        
        // Check if payroll ledger is in APPROVED status
        if (payrollLedger.getStatus() != PayrollStatus.APPROVED) {
            throw new IllegalStateException("Cannot process payment for payroll ledger with ID: " + id + 
                    " in status: " + payrollLedger.getStatus() + ". Only APPROVED ledgers can be paid.");
        }
        
        // Update payment information
        payrollLedger.setStatus(PayrollStatus.PAID);
        payrollLedger.setPaymentDate(LocalDate.now());
        payrollLedger.setPaymentReference(paymentReference);
        
        PayrollLedger updatedPayrollLedger = payrollRepository.save(payrollLedger);
        
        return convertToDTO(updatedPayrollLedger);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPayrollStatsByDepartment(YearMonth payPeriod) {
        log.info("Getting payroll statistics by department for pay period: {}", payPeriod);
        
        List<Object[]> stats = payrollRepository.getPayrollStatsByDepartment(payPeriod);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : stats) {
            Map<String, Object> item = new HashMap<>();
            item.put("departmentName", row[0]);
            item.put("count", row[1]);
            item.put("totalAmount", row[2]);
            result.add(item);
        }
        
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPayrollStatsByStatus(YearMonth payPeriod) {
        log.info("Getting payroll statistics by status for pay period: {}", payPeriod);
        
        List<Object[]> stats = payrollRepository.getPayrollStatsByStatus(payPeriod);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : stats) {
            Map<String, Object> item = new HashMap<>();
            PayrollStatus status = (PayrollStatus) row[0];
            item.put("status", status);
            item.put("statusDisplayName", status.getDisplayName());
            item.put("count", row[1]);
            item.put("totalAmount", row[2]);
            result.add(item);
        }
        
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPayrollAmount(YearMonth payPeriod) {
        log.info("Getting total payroll amount for pay period: {}", payPeriod);
        
        BigDecimal total = payrollRepository.getTotalNetSalaryByPayPeriod(payPeriod);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalPayrollAmountByDepartment(Long departmentId, YearMonth payPeriod) {
        log.info("Getting total payroll amount for department ID: {} and pay period: {}", departmentId, payPeriod);
        
        BigDecimal total = payrollRepository.getTotalNetSalaryByDepartmentAndPayPeriod(departmentId, payPeriod);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional
    public List<PayrollLedgerDTO> generatePayrollLedgers(YearMonth payPeriod) {
        log.info("Generating payroll ledgers for all active employees for pay period: {}", payPeriod);
        
        // Get all active employees - using findAll with a specification instead of findByStatus
        List<Employee> activeEmployees = employeeRepository.findAll()
                .stream()
                .filter(e -> e.getStatus() == Employee.EmployeeStatus.ACTIVE)
                .collect(Collectors.toList());
        
        List<PayrollLedgerDTO> generatedLedgers = new ArrayList<>();
        
        for (Employee employee : activeEmployees) {
            // Skip if payroll ledger already exists for this employee and pay period
            if (payrollRepository.existsByEmployeeIdAndPayPeriod(employee.getId(), payPeriod)) {
                log.info("Payroll ledger already exists for employee ID: {} and pay period: {}", 
                        employee.getId(), payPeriod);
                continue;
            }
            
            try {
                // Generate payroll ledger for employee
                PayrollLedger payrollLedger = new PayrollLedger();
                payrollLedger.setEmployee(employee);
                payrollLedger.setPayPeriod(payPeriod);
                payrollLedger.setStatus(PayrollStatus.DRAFT);
                
                // Set base salary from employee record
                BigDecimal monthlySalary = employee.getSalary() != null ? 
                        employee.getSalary() : BigDecimal.ZERO;
                payrollLedger.setBaseSalary(monthlySalary);
                
                // Initialize other fields with zero
                payrollLedger.setOvertimePay(BigDecimal.ZERO);
                payrollLedger.setBonus(BigDecimal.ZERO);
                payrollLedger.setAllowances(BigDecimal.ZERO);
                payrollLedger.setTaxDeductions(BigDecimal.ZERO);
                payrollLedger.setInsuranceDeductions(BigDecimal.ZERO);
                payrollLedger.setOtherDeductions(BigDecimal.ZERO);
                
                // Calculate net salary
                calculatePayrollValues(payrollLedger);
                
                // Save payroll ledger
                PayrollLedger savedPayrollLedger = payrollRepository.save(payrollLedger);
                
                generatedLedgers.add(convertToDTO(savedPayrollLedger));
            } catch (Exception e) {
                log.error("Error generating payroll ledger for employee ID: {}: {}", 
                        employee.getId(), e.getMessage());
            }
        }
        
        return generatedLedgers;
    }

    @Override
    @Transactional
    public PayrollLedgerDTO generatePayrollLedger(Long employeeId, YearMonth payPeriod) {
        log.info("Generating payroll ledger for employee ID: {} and pay period: {}", employeeId, payPeriod);
        
        // Check if payroll ledger already exists
        if (payrollRepository.existsByEmployeeIdAndPayPeriod(employeeId, payPeriod)) {
            throw new IllegalStateException("Payroll ledger already exists for employee ID: " + 
                    employeeId + " and pay period: " + payPeriod);
        }
        
        // Find employee
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + employeeId));
        
        // Check if employee is active
        if (employee.getStatus() != Employee.EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Cannot generate payroll for inactive employee ID: " + employeeId);
        }
        
        // Create payroll ledger
        PayrollLedger payrollLedger = new PayrollLedger();
        payrollLedger.setEmployee(employee);
        payrollLedger.setPayPeriod(payPeriod);
        payrollLedger.setStatus(PayrollStatus.DRAFT);
        
        // Set base salary from employee record
        BigDecimal monthlySalary = employee.getSalary() != null ? 
                employee.getSalary() : BigDecimal.ZERO;
        payrollLedger.setBaseSalary(monthlySalary);
        
        // Initialize other fields with zero
        payrollLedger.setOvertimePay(BigDecimal.ZERO);
        payrollLedger.setBonus(BigDecimal.ZERO);
        payrollLedger.setAllowances(BigDecimal.ZERO);
        payrollLedger.setTaxDeductions(BigDecimal.ZERO);
        payrollLedger.setInsuranceDeductions(BigDecimal.ZERO);
        payrollLedger.setOtherDeductions(BigDecimal.ZERO);
        
        // Calculate net salary
        calculatePayrollValues(payrollLedger);
        
        // Save payroll ledger
        PayrollLedger savedPayrollLedger = payrollRepository.save(payrollLedger);
        
        return convertToDTO(savedPayrollLedger);
    }

    /**
     * Convert PayrollLedger entity to DTO
     * 
     * @param payrollLedger the entity
     * @return the DTO
     */
    private PayrollLedgerDTO convertToDTO(PayrollLedger payrollLedger) {
        PayrollLedgerDTO dto = new PayrollLedgerDTO();
        
        dto.setId(payrollLedger.getId());
        dto.setEmployeeId(payrollLedger.getEmployee().getId());
        dto.setEmployeeName(payrollLedger.getEmployee().getName());
        dto.setEmployeeNumber(payrollLedger.getEmployee().getEmployeeNumber());
        dto.setDepartmentId(payrollLedger.getEmployee().getDepartment().getId());
        dto.setDepartmentName(payrollLedger.getEmployee().getDepartment().getName());
        dto.setPayPeriod(payrollLedger.getPayPeriod());
        dto.setFormattedPayPeriod(payrollLedger.getFormattedPayPeriod());
        dto.setBaseSalary(payrollLedger.getBaseSalary());
        dto.setOvertimePay(payrollLedger.getOvertimePay());
        dto.setBonus(payrollLedger.getBonus());
        dto.setAllowances(payrollLedger.getAllowances());
        dto.setTaxDeductions(payrollLedger.getTaxDeductions());
        dto.setInsuranceDeductions(payrollLedger.getInsuranceDeductions());
        dto.setOtherDeductions(payrollLedger.getOtherDeductions());
        dto.setNetSalary(payrollLedger.getNetSalary());
        dto.setGrossSalary(payrollLedger.calculateGrossSalary());
        dto.setTotalDeductions(payrollLedger.calculateTotalDeductions());
        dto.setPaymentDate(payrollLedger.getPaymentDate());
        dto.setPaymentReference(payrollLedger.getPaymentReference());
        dto.setNotes(payrollLedger.getNotes());
        dto.setStatus(payrollLedger.getStatus());
        dto.setStatusDisplayName(payrollLedger.getStatus().getDisplayName());
        dto.setCreatedBy(payrollLedger.getCreatedBy());
        dto.setUpdatedBy(payrollLedger.getUpdatedBy());
        dto.setCreatedAt(payrollLedger.getCreatedAt() != null ? 
                payrollLedger.getCreatedAt().toLocalDate() : null);
        dto.setUpdatedAt(payrollLedger.getUpdatedAt() != null ? 
                payrollLedger.getUpdatedAt().toLocalDate() : null);
        dto.setModifiable(payrollLedger.isModifiable());
        
        return dto;
    }

    /**
     * Convert PayrollLedgerDTO to entity
     * 
     * @param dto the DTO
     * @return the entity
     */
    private PayrollLedger convertToEntity(PayrollLedgerDTO dto) {
        PayrollLedger entity = new PayrollLedger();
        
        entity.setId(dto.getId());
        
        // Employee will be set separately
        
        entity.setPayPeriod(dto.getPayPeriod());
        entity.setBaseSalary(dto.getBaseSalary());
        entity.setOvertimePay(dto.getOvertimePay());
        entity.setBonus(dto.getBonus());
        entity.setAllowances(dto.getAllowances());
        entity.setTaxDeductions(dto.getTaxDeductions());
        entity.setInsuranceDeductions(dto.getInsuranceDeductions());
        entity.setOtherDeductions(dto.getOtherDeductions());
        entity.setNetSalary(dto.getNetSalary());
        entity.setPaymentDate(dto.getPaymentDate());
        entity.setPaymentReference(dto.getPaymentReference());
        entity.setNotes(dto.getNotes());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : PayrollStatus.DRAFT);
        
        return entity;
    }

    /**
     * Update PayrollLedger entity fields from DTO
     * 
     * @param entity the entity to update
     * @param dto the source DTO
     */
    private void updatePayrollLedgerFields(PayrollLedger entity, PayrollLedgerDTO dto) {
        // Don't update ID, employee, or pay period
        
        entity.setBaseSalary(dto.getBaseSalary());
        entity.setOvertimePay(dto.getOvertimePay());
        entity.setBonus(dto.getBonus());
        entity.setAllowances(dto.getAllowances());
        entity.setTaxDeductions(dto.getTaxDeductions());
        entity.setInsuranceDeductions(dto.getInsuranceDeductions());
        entity.setOtherDeductions(dto.getOtherDeductions());
        entity.setNetSalary(dto.getNetSalary());
        entity.setNotes(dto.getNotes());
        
        // Don't update status, payment date, or payment reference here
    }

    /**
     * Calculate payroll values (gross salary, deductions, net salary)
     * 
     * @param payrollLedger the payroll ledger to calculate
     */
    private void calculatePayrollValues(PayrollLedger payrollLedger) {
        // Calculate gross salary
        BigDecimal grossSalary = payrollLedger.calculateGrossSalary();
        
        // Calculate total deductions
        BigDecimal totalDeductions = payrollLedger.calculateTotalDeductions();
        
        // Calculate net salary
        BigDecimal netSalary = grossSalary.subtract(totalDeductions);
        
        // Set net salary
        payrollLedger.setNetSalary(netSalary);
    }

    /**
     * Validate payroll calculations
     * 
     * @param payrollLedger the payroll ledger to validate
     * @throws PayrollCalculationException if validation fails
     */
    private void validatePayrollCalculations(PayrollLedger payrollLedger) {
        // Check for null values
        if (payrollLedger.getBaseSalary() == null) {
            throw new PayrollCalculationException("Base salary cannot be null");
        }
        
        if (payrollLedger.getNetSalary() == null) {
            throw new PayrollCalculationException("Net salary cannot be null");
        }
        
        // Check for negative values
        if (payrollLedger.getBaseSalary().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Base salary cannot be negative");
        }
        
        if (payrollLedger.getOvertimePay() != null && 
                payrollLedger.getOvertimePay().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Overtime pay cannot be negative");
        }
        
        if (payrollLedger.getBonus() != null && 
                payrollLedger.getBonus().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Bonus cannot be negative");
        }
        
        if (payrollLedger.getAllowances() != null && 
                payrollLedger.getAllowances().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Allowances cannot be negative");
        }
        
        if (payrollLedger.getTaxDeductions() != null && 
                payrollLedger.getTaxDeductions().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Tax deductions cannot be negative");
        }
        
        if (payrollLedger.getInsuranceDeductions() != null && 
                payrollLedger.getInsuranceDeductions().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Insurance deductions cannot be negative");
        }
        
        if (payrollLedger.getOtherDeductions() != null && 
                payrollLedger.getOtherDeductions().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Other deductions cannot be negative");
        }
        
        if (payrollLedger.getNetSalary().compareTo(BigDecimal.ZERO) < 0) {
            throw new PayrollCalculationException("Net salary cannot be negative");
        }
        
        // Validate net salary calculation
        BigDecimal calculatedNetSalary = payrollLedger.calculateNetSalary();
        if (payrollLedger.getNetSalary().compareTo(calculatedNetSalary) != 0) {
            throw new PayrollCalculationException("Net salary does not match calculated value. " +
                    "Expected: " + calculatedNetSalary + ", Actual: " + payrollLedger.getNetSalary());
        }
    }

    /**
     * Validate payroll status transition
     * 
     * @param currentStatus the current status
     * @param newStatus the new status
     * @throws IllegalStateException if transition is invalid
     */
    private void validateStatusTransition(PayrollStatus currentStatus, PayrollStatus newStatus) {
        if (currentStatus == newStatus) {
            return; // No change
        }
        
        switch (currentStatus) {
            case DRAFT:
                // DRAFT -> CALCULATED, CANCELLED
                if (newStatus != PayrollStatus.CALCULATED && newStatus != PayrollStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition from " + 
                            currentStatus + " to " + newStatus);
                }
                break;
            case CALCULATED:
                // CALCULATED -> APPROVED, DRAFT, CANCELLED
                if (newStatus != PayrollStatus.APPROVED && newStatus != PayrollStatus.DRAFT && 
                        newStatus != PayrollStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition from " + 
                            currentStatus + " to " + newStatus);
                }
                break;
            case APPROVED:
                // APPROVED -> PAID, CALCULATED, CANCELLED
                if (newStatus != PayrollStatus.PAID && newStatus != PayrollStatus.CALCULATED && 
                        newStatus != PayrollStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition from " + 
                            currentStatus + " to " + newStatus);
                }
                break;
            case PAID:
                // PAID -> CANCELLED
                if (newStatus != PayrollStatus.CANCELLED) {
                    throw new IllegalStateException("Invalid status transition from " + 
                            currentStatus + " to " + newStatus);
                }
                break;
            case CANCELLED:
                // CANCELLED -> No valid transitions
                throw new IllegalStateException("Cannot transition from CANCELLED status");
            default:
                throw new IllegalStateException("Unknown status: " + currentStatus);
        }
    }

    /**
     * Build JPA Specification from search criteria
     * 
     * @param criteria the search criteria
     * @return the specification
     */
    private Specification<PayrollLedger> buildSpecificationFromCriteria(PayrollSearchCriteria criteria) {
        Specification<PayrollLedger> spec = (root, query, criteriaBuilder) -> null;
        
        if (criteria == null) {
            return spec;
        }
        
        if (criteria.getEmployeeId() != null) {
            spec = spec.and(PayrollSpecification.hasEmployeeId(criteria.getEmployeeId()));
        }
        
        if (criteria.getDepartmentId() != null) {
            spec = spec.and(PayrollSpecification.inDepartment(criteria.getDepartmentId()));
        }
        
        if (criteria.getPayPeriod() != null) {
            spec = spec.and(PayrollSpecification.hasPayPeriod(criteria.getPayPeriod()));
        }
        
        if (criteria.getStatus() != null) {
            spec = spec.and(PayrollSpecification.hasStatus(criteria.getStatus()));
        }
        
        if (criteria.getMinNetSalary() != null) {
            spec = spec.and(PayrollSpecification.hasMinNetSalary(criteria.getMinNetSalary()));
        }
        
        if (criteria.getMaxNetSalary() != null) {
            spec = spec.and(PayrollSpecification.hasMaxNetSalary(criteria.getMaxNetSalary()));
        }
        
        if (Boolean.TRUE.equals(criteria.getModifiableOnly())) {
            spec = spec.and(PayrollSpecification.isModifiable());
        }
        
        return spec;
    }
}
