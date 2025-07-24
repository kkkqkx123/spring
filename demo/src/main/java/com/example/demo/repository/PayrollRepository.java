package com.example.demo.repository;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;

/**
 * Repository interface for PayrollLedger entity
 * Provides CRUD operations, pagination, and audit trail support
 */
@Repository
public interface PayrollRepository extends JpaRepository<PayrollLedger, Long>, JpaSpecificationExecutor<PayrollLedger> {
    
    /**
     * Find payroll ledger by employee ID and pay period
     * 
     * @param employeeId the employee ID
     * @param payPeriod the pay period
     * @return Optional containing the payroll ledger if found
     */
    Optional<PayrollLedger> findByEmployeeIdAndPayPeriod(Long employeeId, YearMonth payPeriod);
    
    /**
     * Check if payroll ledger exists for employee and pay period
     * 
     * @param employeeId the employee ID
     * @param payPeriod the pay period
     * @return true if exists, false otherwise
     */
    boolean existsByEmployeeIdAndPayPeriod(Long employeeId, YearMonth payPeriod);
    
    /**
     * Find payroll ledgers by employee ID with pagination
     * 
     * @param employeeId the employee ID
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedger> findByEmployeeId(Long employeeId, Pageable pageable);
    
    /**
     * Find payroll ledgers by pay period with pagination
     * 
     * @param payPeriod the pay period
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedger> findByPayPeriod(YearMonth payPeriod, Pageable pageable);
    
    /**
     * Find payroll ledgers by status with pagination
     * 
     * @param status the payroll status
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedger> findByStatus(PayrollStatus status, Pageable pageable);
    
    /**
     * Find payroll ledgers by employee ID and status
     * 
     * @param employeeId the employee ID
     * @param status the payroll status
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedger> findByEmployeeIdAndStatus(Long employeeId, PayrollStatus status, Pageable pageable);
    
    /**
     * Find payroll ledgers by pay period and status
     * 
     * @param payPeriod the pay period
     * @param status the payroll status
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    Page<PayrollLedger> findByPayPeriodAndStatus(YearMonth payPeriod, PayrollStatus status, Pageable pageable);
    
    /**
     * Find payroll ledgers by employee department ID
     * 
     * @param departmentId the department ID
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    @Query("SELECT pl FROM PayrollLedger pl JOIN pl.employee e WHERE e.department.id = :departmentId")
    Page<PayrollLedger> findByEmployeeDepartmentId(@Param("departmentId") Long departmentId, Pageable pageable);
    
    /**
     * Find payroll ledgers by employee department ID and pay period
     * 
     * @param departmentId the department ID
     * @param payPeriod the pay period
     * @param pageable pagination information
     * @return page of payroll ledgers
     */
    @Query("SELECT pl FROM PayrollLedger pl JOIN pl.employee e WHERE e.department.id = :departmentId AND pl.payPeriod = :payPeriod")
    Page<PayrollLedger> findByEmployeeDepartmentIdAndPayPeriod(
            @Param("departmentId") Long departmentId, 
            @Param("payPeriod") YearMonth payPeriod, 
            Pageable pageable);
    
    /**
     * Advanced search query with multiple criteria
     * 
     * @param employeeId employee ID
     * @param departmentId department ID
     * @param payPeriod pay period
     * @param status payroll status
     * @param minNetSalary minimum net salary
     * @param maxNetSalary maximum net salary
     * @param pageable pagination information
     * @return page of payroll ledgers matching criteria
     */
    @Query("SELECT pl FROM PayrollLedger pl JOIN pl.employee e " +
           "WHERE (:employeeId IS NULL OR e.id = :employeeId) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
           "AND (:payPeriod IS NULL OR pl.payPeriod = :payPeriod) " +
           "AND (:status IS NULL OR pl.status = :status) " +
           "AND (:minNetSalary IS NULL OR pl.netSalary >= :minNetSalary) " +
           "AND (:maxNetSalary IS NULL OR pl.netSalary <= :maxNetSalary)")
    Page<PayrollLedger> findByAdvancedSearch(
        @Param("employeeId") Long employeeId,
        @Param("departmentId") Long departmentId,
        @Param("payPeriod") YearMonth payPeriod,
        @Param("status") PayrollStatus status,
        @Param("minNetSalary") BigDecimal minNetSalary,
        @Param("maxNetSalary") BigDecimal maxNetSalary,
        Pageable pageable
    );
    
    /**
     * Count payroll ledgers by employee ID
     * 
     * @param employeeId the employee ID
     * @return count of payroll ledgers
     */
    long countByEmployeeId(Long employeeId);
    
    /**
     * Count payroll ledgers by pay period
     * 
     * @param payPeriod the pay period
     * @return count of payroll ledgers
     */
    long countByPayPeriod(YearMonth payPeriod);
    
    /**
     * Count payroll ledgers by status
     * 
     * @param status the payroll status
     * @return count of payroll ledgers
     */
    long countByStatus(PayrollStatus status);
    
    /**
     * Get total net salary by pay period
     * 
     * @param payPeriod the pay period
     * @return total net salary
     */
    @Query("SELECT SUM(pl.netSalary) FROM PayrollLedger pl WHERE pl.payPeriod = :payPeriod")
    BigDecimal getTotalNetSalaryByPayPeriod(@Param("payPeriod") YearMonth payPeriod);
    
    /**
     * Get total net salary by department and pay period
     * 
     * @param departmentId the department ID
     * @param payPeriod the pay period
     * @return total net salary
     */
    @Query("SELECT SUM(pl.netSalary) FROM PayrollLedger pl JOIN pl.employee e " +
           "WHERE e.department.id = :departmentId AND pl.payPeriod = :payPeriod")
    BigDecimal getTotalNetSalaryByDepartmentAndPayPeriod(
            @Param("departmentId") Long departmentId, 
            @Param("payPeriod") YearMonth payPeriod);
    
    /**
     * Get payroll statistics by department
     * 
     * @param payPeriod the pay period
     * @return list of department statistics
     */
    @Query("SELECT d.name, COUNT(pl), SUM(pl.netSalary) FROM PayrollLedger pl " +
           "JOIN pl.employee e JOIN e.department d " +
           "WHERE pl.payPeriod = :payPeriod " +
           "GROUP BY d.id, d.name ORDER BY SUM(pl.netSalary) DESC")
    List<Object[]> getPayrollStatsByDepartment(@Param("payPeriod") YearMonth payPeriod);
    
    /**
     * Get payroll statistics by status
     * 
     * @param payPeriod the pay period
     * @return list of status statistics
     */
    @Query("SELECT pl.status, COUNT(pl), SUM(pl.netSalary) FROM PayrollLedger pl " +
           "WHERE pl.payPeriod = :payPeriod " +
           "GROUP BY pl.status ORDER BY COUNT(pl) DESC")
    List<Object[]> getPayrollStatsByStatus(@Param("payPeriod") YearMonth payPeriod);
    
    /**
     * Find all payroll ledgers by IDs for batch operations
     * 
     * @param ids list of payroll ledger IDs
     * @return list of payroll ledgers
     */
    List<PayrollLedger> findByIdIn(List<Long> ids);
}