package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;

/**
 * Repository interface for Employee entity
 * Provides CRUD operations, pagination, and advanced search functionality
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    
    /**
     * Find employee by employee number
     * 
     * @param employeeNumber the employee number
     * @return Optional containing the employee if found
     */
    Optional<Employee> findByEmployeeNumber(String employeeNumber);
    
    /**
     * Find employee by email
     * 
     * @param email the email address
     * @return Optional containing the employee if found
     */
    Optional<Employee> findByEmail(String email);
    
    /**
     * Check if employee number exists
     * 
     * @param employeeNumber the employee number to check
     * @return true if exists, false otherwise
     */
    boolean existsByEmployeeNumber(String employeeNumber);
    
    /**
     * Check if email exists
     * 
     * @param email the email to check
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Find employees by department ID with pagination
     * 
     * @param departmentId the department ID
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> findByDepartmentId(Long departmentId, Pageable pageable);
    
    /**
     * Find employees by position ID with pagination
     * 
     * @param positionId the position ID
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> findByPositionId(Long positionId, Pageable pageable);
    
    /**
     * Find employees by status with pagination
     * 
     * @param status the employee status
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> findByStatus(EmployeeStatus status, Pageable pageable);
    
    /**
     * Find employees by name containing (case-insensitive) with pagination
     * 
     * @param name the name to search for
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    /**
     * Find employees by email containing (case-insensitive) with pagination
     * 
     * @param email the email to search for
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> findByEmailContainingIgnoreCase(String email, Pageable pageable);
    
    /**
     * Find employees hired between two dates
     * 
     * @param startDate the start date
     * @param endDate the end date
     * @param pageable pagination information
     * @return page of employees
     */
    Page<Employee> findByHireDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    /**
     * Find employees by department name (case-insensitive) with pagination
     * 
     * @param departmentName the department name
     * @param pageable pagination information
     * @return page of employees
     */
    @Query("SELECT e FROM Employee e JOIN e.department d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :departmentName, '%'))")
    Page<Employee> findByDepartmentNameContainingIgnoreCase(@Param("departmentName") String departmentName, Pageable pageable);
    
    /**
     * Find employees by position job title (case-insensitive) with pagination
     * 
     * @param jobTitle the job title
     * @param pageable pagination information
     * @return page of employees
     */
    @Query("SELECT e FROM Employee e JOIN e.position p WHERE LOWER(p.jobTitle) LIKE LOWER(CONCAT('%', :jobTitle, '%'))")
    Page<Employee> findByPositionJobTitleContainingIgnoreCase(@Param("jobTitle") String jobTitle, Pageable pageable);
    
    /**
     * Advanced search query with multiple criteria
     * 
     * @param name employee name (partial match)
     * @param email employee email (partial match)
     * @param departmentId department ID
     * @param positionId position ID
     * @param status employee status
     * @param hireDateStart hire date range start
     * @param hireDateEnd hire date range end
     * @param pageable pagination information
     * @return page of employees matching criteria
     */
    @Query("SELECT e FROM Employee e " +
           "WHERE (:name IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
           "AND (:email IS NULL OR LOWER(e.email) LIKE LOWER(CONCAT('%', :email, '%'))) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
           "AND (:positionId IS NULL OR e.position.id = :positionId) " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:hireDateStart IS NULL OR e.hireDate >= :hireDateStart) " +
           "AND (:hireDateEnd IS NULL OR e.hireDate <= :hireDateEnd)")
    Page<Employee> findByAdvancedSearch(
        @Param("name") String name,
        @Param("email") String email,
        @Param("departmentId") Long departmentId,
        @Param("positionId") Long positionId,
        @Param("status") EmployeeStatus status,
        @Param("hireDateStart") LocalDate hireDateStart,
        @Param("hireDateEnd") LocalDate hireDateEnd,
        Pageable pageable
    );
    
    /**
     * Count employees by department
     * 
     * @param departmentId the department ID
     * @return count of employees
     */
    long countByDepartmentId(Long departmentId);
    
    /**
     * Count employees by position
     * 
     * @param positionId the position ID
     * @return count of employees
     */
    long countByPositionId(Long positionId);
    
    /**
     * Count employees by status
     * 
     * @param status the employee status
     * @return count of employees
     */
    long countByStatus(EmployeeStatus status);
    
    /**
     * Find all employees by IDs for batch operations
     * 
     * @param ids list of employee IDs
     * @return list of employees
     */
    List<Employee> findByIdIn(List<Long> ids);
    
    /**
     * Find employees with upcoming work anniversaries (within next 30 days)
     * 
     * @return list of employees with upcoming anniversaries
     */
    @Query(value = "SELECT * FROM employees e WHERE " +
           "EXTRACT(MONTH FROM hire_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND " +
           "EXTRACT(DAY FROM hire_date) >= EXTRACT(DAY FROM CURRENT_DATE)", 
           nativeQuery = true)
    List<Employee> findEmployeesWithUpcomingAnniversaries();
    
    /**
     * Find employees with birthdays in current month
     * 
     * @return list of employees with birthdays this month
     */
    @Query("SELECT e FROM Employee e WHERE MONTH(e.birthDate) = MONTH(CURRENT_DATE)")
    List<Employee> findEmployeesWithBirthdaysThisMonth();
    
    /**
     * Get employee statistics by department
     * 
     * @return list of department statistics
     */
    @Query("SELECT d.name, COUNT(e) FROM Employee e JOIN e.department d GROUP BY d.id, d.name ORDER BY COUNT(e) DESC")
    List<Object[]> getEmployeeCountByDepartment();
    
    /**
     * Get employee statistics by status
     * 
     * @return list of status statistics
     */
    @Query("SELECT e.status, COUNT(e) FROM Employee e GROUP BY e.status ORDER BY COUNT(e) DESC")
    List<Object[]> getEmployeeCountByStatus();
}