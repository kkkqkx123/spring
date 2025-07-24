package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.Employee.Gender;
import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.specification.PayrollSpecification;

@DataJpaTest
@ActiveProfiles("test")
public class PayrollRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PayrollRepository payrollRepository;

    private Department itDepartment;
    private Department hrDepartment;
    private Position developerPosition;
    private Position managerPosition;
    private Employee employee1;
    private Employee employee2;
    private Employee employee3;
    private PayrollLedger payroll1;
    private PayrollLedger payroll2;
    private PayrollLedger payroll3;
    private PayrollLedger payroll4;

    @BeforeEach
    void setUp() {
        // Create departments
        itDepartment = new Department();
        itDepartment.setName("IT Department");
        itDepartment.setDescription("Information Technology Department");
        itDepartment.setCreatedAt(LocalDateTime.now());
        itDepartment.setCreatedBy("test-user");
        itDepartment = entityManager.persistAndFlush(itDepartment);

        hrDepartment = new Department();
        hrDepartment.setName("HR Department");
        hrDepartment.setDescription("Human Resources Department");
        hrDepartment.setCreatedAt(LocalDateTime.now());
        hrDepartment.setCreatedBy("test-user");
        hrDepartment = entityManager.persistAndFlush(hrDepartment);

        // Create positions
        developerPosition = new Position();
        developerPosition.setJobTitle("Software Developer");
        developerPosition.setDescription("Develops software applications");
        developerPosition.setDepartment(itDepartment);
        developerPosition.setCreatedAt(LocalDateTime.now());
        developerPosition.setCreatedBy("test-user");
        developerPosition = entityManager.persistAndFlush(developerPosition);

        managerPosition = new Position();
        managerPosition.setJobTitle("Department Manager");
        managerPosition.setDescription("Manages department operations");
        managerPosition.setDepartment(hrDepartment);
        managerPosition.setCreatedAt(LocalDateTime.now());
        managerPosition.setCreatedBy("test-user");
        managerPosition = entityManager.persistAndFlush(managerPosition);

        // Create employees
        employee1 = Employee.builder()
                .employeeNumber("EMP001")
                .name("John Doe")
                .email("john.doe@example.com")
                .phone("+1234567890")
                .department(itDepartment)
                .position(developerPosition)
                .hireDate(LocalDate.of(2020, 1, 15))
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(1985, 5, 15))
                .address("123 Main St, City")
                .salary(new BigDecimal("75000.00"))
                .build();
        employee1.setCreatedAt(LocalDateTime.now());
        employee1.setCreatedBy("test-user");
        entityManager.persistAndFlush(employee1);

        employee2 = Employee.builder()
                .employeeNumber("EMP002")
                .name("Jane Smith")
                .email("jane.smith@example.com")
                .phone("+1987654321")
                .department(hrDepartment)
                .position(managerPosition)
                .hireDate(LocalDate.of(2019, 3, 10))
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.FEMALE)
                .birthDate(LocalDate.of(1980, 8, 22))
                .address("456 Oak Ave, Town")
                .salary(new BigDecimal("95000.00"))
                .build();
        employee2.setCreatedAt(LocalDateTime.now());
        employee2.setCreatedBy("test-user");
        entityManager.persistAndFlush(employee2);

        employee3 = Employee.builder()
                .employeeNumber("EMP003")
                .name("Robert Johnson")
                .email("robert.johnson@example.com")
                .phone("+1122334455")
                .department(itDepartment)
                .position(developerPosition)
                .hireDate(LocalDate.of(2021, 6, 5))
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(1990, 2, 10))
                .address("789 Pine St, Village")
                .salary(new BigDecimal("70000.00"))
                .build();
        employee3.setCreatedAt(LocalDateTime.now());
        employee3.setCreatedBy("test-user");
        entityManager.persistAndFlush(employee3);

        // Create payroll ledgers
        payroll1 = PayrollLedger.builder()
                .employee(employee1)
                .payPeriod(YearMonth.of(2023, 1))
                .baseSalary(new BigDecimal("6250.00"))
                .overtimePay(new BigDecimal("500.00"))
                .bonus(new BigDecimal("1000.00"))
                .allowances(new BigDecimal("300.00"))
                .taxDeductions(new BigDecimal("1500.00"))
                .insuranceDeductions(new BigDecimal("200.00"))
                .otherDeductions(new BigDecimal("100.00"))
                .netSalary(new BigDecimal("6250.00"))
                .status(PayrollStatus.PAID)
                .paymentDate(LocalDate.of(2023, 1, 31))
                .paymentReference("PAY-2023-01-001")
                .build();
        payroll1.setCreatedAt(LocalDateTime.now());
        payroll1.setCreatedBy("test-user");
        entityManager.persistAndFlush(payroll1);

        payroll2 = PayrollLedger.builder()
                .employee(employee2)
                .payPeriod(YearMonth.of(2023, 1))
                .baseSalary(new BigDecimal("7916.67"))
                .overtimePay(BigDecimal.ZERO)
                .bonus(new BigDecimal("2000.00"))
                .allowances(new BigDecimal("500.00"))
                .taxDeductions(new BigDecimal("2000.00"))
                .insuranceDeductions(new BigDecimal("300.00"))
                .otherDeductions(new BigDecimal("150.00"))
                .netSalary(new BigDecimal("7966.67"))
                .status(PayrollStatus.PAID)
                .paymentDate(LocalDate.of(2023, 1, 31))
                .paymentReference("PAY-2023-01-002")
                .build();
        payroll2.setCreatedAt(LocalDateTime.now());
        payroll2.setCreatedBy("test-user");
        entityManager.persistAndFlush(payroll2);

        payroll3 = PayrollLedger.builder()
                .employee(employee1)
                .payPeriod(YearMonth.of(2023, 2))
                .baseSalary(new BigDecimal("6250.00"))
                .overtimePay(new BigDecimal("750.00"))
                .bonus(BigDecimal.ZERO)
                .allowances(new BigDecimal("300.00"))
                .taxDeductions(new BigDecimal("1400.00"))
                .insuranceDeductions(new BigDecimal("200.00"))
                .otherDeductions(new BigDecimal("100.00"))
                .netSalary(new BigDecimal("5600.00"))
                .status(PayrollStatus.APPROVED)
                .build();
        payroll3.setCreatedAt(LocalDateTime.now());
        payroll3.setCreatedBy("test-user");
        entityManager.persistAndFlush(payroll3);

        payroll4 = PayrollLedger.builder()
                .employee(employee3)
                .payPeriod(YearMonth.of(2023, 2))
                .baseSalary(new BigDecimal("5833.33"))
                .overtimePay(new BigDecimal("300.00"))
                .bonus(BigDecimal.ZERO)
                .allowances(new BigDecimal("200.00"))
                .taxDeductions(new BigDecimal("1200.00"))
                .insuranceDeductions(new BigDecimal("180.00"))
                .otherDeductions(new BigDecimal("80.00"))
                .netSalary(new BigDecimal("4873.33"))
                .status(PayrollStatus.DRAFT)
                .build();
        payroll4.setCreatedAt(LocalDateTime.now());
        payroll4.setCreatedBy("test-user");
        entityManager.persistAndFlush(payroll4);
    }

    @Test
    void findByEmployeeIdAndPayPeriod_ShouldReturnPayrollLedger() {
        // Act
        Optional<PayrollLedger> result = payrollRepository.findByEmployeeIdAndPayPeriod(
                employee1.getId(), YearMonth.of(2023, 1));

        // Assert
        assertTrue(result.isPresent());
        assertEquals(PayrollStatus.PAID, result.get().getStatus());
        assertEquals(new BigDecimal("6250.00"), result.get().getNetSalary());
    }

    @Test
    void existsByEmployeeIdAndPayPeriod_WithExistingRecord_ShouldReturnTrue() {
        // Act
        boolean exists = payrollRepository.existsByEmployeeIdAndPayPeriod(
                employee1.getId(), YearMonth.of(2023, 1));

        // Assert
        assertTrue(exists);
    }

    @Test
    void existsByEmployeeIdAndPayPeriod_WithNonExistingRecord_ShouldReturnFalse() {
        // Act
        boolean exists = payrollRepository.existsByEmployeeIdAndPayPeriod(
                employee1.getId(), YearMonth.of(2023, 3));

        // Assert
        assertFalse(exists);
    }

    @Test
    void findByEmployeeId_ShouldReturnPayrollLedgersForEmployee() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByEmployeeId(employee1.getId(), pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(pl -> pl.getEmployee().getId().equals(employee1.getId())));
    }

    @Test
    void findByPayPeriod_ShouldReturnPayrollLedgersForPeriod() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByPayPeriod(YearMonth.of(2023, 1), pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(pl -> pl.getPayPeriod().equals(YearMonth.of(2023, 1))));
    }

    @Test
    void findByStatus_ShouldReturnPayrollLedgersWithStatus() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByStatus(PayrollStatus.PAID, pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(pl -> pl.getStatus() == PayrollStatus.PAID));
    }

    @Test
    void findByEmployeeIdAndStatus_ShouldReturnMatchingPayrollLedgers() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByEmployeeIdAndStatus(
                employee1.getId(), PayrollStatus.PAID, pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(employee1.getId(), result.getContent().get(0).getEmployee().getId());
        assertEquals(PayrollStatus.PAID, result.getContent().get(0).getStatus());
    }

    @Test
    void findByPayPeriodAndStatus_ShouldReturnMatchingPayrollLedgers() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByPayPeriodAndStatus(
                YearMonth.of(2023, 2), PayrollStatus.DRAFT, pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(YearMonth.of(2023, 2), result.getContent().get(0).getPayPeriod());
        assertEquals(PayrollStatus.DRAFT, result.getContent().get(0).getStatus());
    }

    @Test
    void findByEmployeeDepartmentId_ShouldReturnPayrollLedgersForDepartment() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByEmployeeDepartmentId(
                itDepartment.getId(), pageable);

        // Assert
        assertEquals(3, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(pl -> pl.getEmployee().getDepartment().getId().equals(itDepartment.getId())));
    }

    @Test
    void findByEmployeeDepartmentIdAndPayPeriod_ShouldReturnMatchingPayrollLedgers() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<PayrollLedger> result = payrollRepository.findByEmployeeDepartmentIdAndPayPeriod(
                hrDepartment.getId(), YearMonth.of(2023, 1), pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(hrDepartment.getId(), result.getContent().get(0).getEmployee().getDepartment().getId());
        assertEquals(YearMonth.of(2023, 1), result.getContent().get(0).getPayPeriod());
    }

    @Test
    void findByAdvancedSearch_WithMultipleCriteria_ShouldReturnMatchingPayrollLedgers() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        YearMonth payPeriod = YearMonth.of(2023, 2);
        PayrollStatus status = PayrollStatus.DRAFT;

        // Act
        Page<PayrollLedger> result = payrollRepository.findByAdvancedSearch(
                null, itDepartment.getId(), payPeriod, status, null, null, pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(employee3.getId(), result.getContent().get(0).getEmployee().getId());
        assertEquals(PayrollStatus.DRAFT, result.getContent().get(0).getStatus());
    }

    @Test
    void countByEmployeeId_ShouldReturnCorrectCount() {
        // Act
        long count = payrollRepository.countByEmployeeId(employee1.getId());

        // Assert
        assertEquals(2, count);
    }

    @Test
    void countByPayPeriod_ShouldReturnCorrectCount() {
        // Act
        long count = payrollRepository.countByPayPeriod(YearMonth.of(2023, 1));

        // Assert
        assertEquals(2, count);
    }

    @Test
    void countByStatus_ShouldReturnCorrectCount() {
        // Act
        long count = payrollRepository.countByStatus(PayrollStatus.PAID);

        // Assert
        assertEquals(2, count);
    }

    @Test
    void getTotalNetSalaryByPayPeriod_ShouldReturnCorrectSum() {
        // Act
        BigDecimal total = payrollRepository.getTotalNetSalaryByPayPeriod(YearMonth.of(2023, 1));

        // Assert
        assertEquals(new BigDecimal("14216.67"), total);
    }

    @Test
    void getTotalNetSalaryByDepartmentAndPayPeriod_ShouldReturnCorrectSum() {
        // Act
        BigDecimal total = payrollRepository.getTotalNetSalaryByDepartmentAndPayPeriod(
                itDepartment.getId(), YearMonth.of(2023, 1));

        // Assert
        assertEquals(new BigDecimal("6250.00"), total);
    }

    @Test
    void getPayrollStatsByDepartment_ShouldReturnCorrectStatistics() {
        // Act
        List<Object[]> result = payrollRepository.getPayrollStatsByDepartment(YearMonth.of(2023, 1));

        // Assert
        assertEquals(2, result.size());
        
        // Find HR department stats (should have higher total salary)
        Object[] hrStats = result.stream()
                .filter(stats -> stats[0].equals(hrDepartment.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(hrStats);
        assertEquals(1L, hrStats[1]);
        assertEquals(new BigDecimal("7966.67"), hrStats[2]);
        
        // Find IT department stats
        Object[] itStats = result.stream()
                .filter(stats -> stats[0].equals(itDepartment.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(itStats);
        assertEquals(1L, itStats[1]);
        assertEquals(new BigDecimal("6250.00"), itStats[2]);
    }

    @Test
    void getPayrollStatsByStatus_ShouldReturnCorrectStatistics() {
        // Act
        List<Object[]> result = payrollRepository.getPayrollStatsByStatus(YearMonth.of(2023, 2));

        // Assert
        assertEquals(2, result.size());
        
        // Find APPROVED status stats
        Object[] approvedStats = result.stream()
                .filter(stats -> stats[0].equals(PayrollStatus.APPROVED))
                .findFirst()
                .orElse(null);
        assertNotNull(approvedStats);
        assertEquals(1L, approvedStats[1]);
        assertEquals(new BigDecimal("5600.00"), approvedStats[2]);
        
        // Find DRAFT status stats
        Object[] draftStats = result.stream()
                .filter(stats -> stats[0].equals(PayrollStatus.DRAFT))
                .findFirst()
                .orElse(null);
        assertNotNull(draftStats);
        assertEquals(1L, draftStats[1]);
        assertEquals(new BigDecimal("4873.33"), draftStats[2]);
    }

    @Test
    void findByIdIn_ShouldReturnMatchingPayrollLedgers() {
        // Act
        List<PayrollLedger> result = payrollRepository.findByIdIn(List.of(payroll1.getId(), payroll3.getId()));

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream()
                .anyMatch(pl -> pl.getId().equals(payroll1.getId())));
        assertTrue(result.stream()
                .anyMatch(pl -> pl.getId().equals(payroll3.getId())));
    }

    @Test
    void testPayrollSpecification_WithMultipleCriteria() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10, Sort.by("netSalary").descending());
        
        Specification<PayrollLedger> spec = PayrollSpecification.hasPayPeriod(YearMonth.of(2023, 2))
                .and(PayrollSpecification.inDepartment(itDepartment.getId()));
        
        // Act
        Page<PayrollLedger> result = payrollRepository.findAll(spec, pageable);
        
        // Assert
        assertEquals(2, result.getTotalElements());
        assertEquals(payroll3.getId(), result.getContent().get(0).getId()); // Higher net salary should be first
        assertEquals(payroll4.getId(), result.getContent().get(1).getId());
    }

    @Test
    void testPayrollSpecification_IsModifiable() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        
        Specification<PayrollLedger> spec = PayrollSpecification.isModifiable();
        
        // Act
        Page<PayrollLedger> result = payrollRepository.findAll(spec, pageable);
        
        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(PayrollStatus.DRAFT, result.getContent().get(0).getStatus());
    }
}