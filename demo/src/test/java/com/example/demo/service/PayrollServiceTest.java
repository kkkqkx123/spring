package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.exception.PayrollCalculationException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PayrollSearchCriteria;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.PayrollRepository;
import com.example.demo.service.impl.PayrollServiceImpl;

@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
public class PayrollServiceTest {

    @Mock
    private PayrollRepository payrollRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private PayrollServiceImpl payrollService;

    private Employee employee;
    private Department department;
    private PayrollLedger payrollLedger;
    private PayrollLedgerDTO payrollLedgerDTO;
    private YearMonth currentPeriod;

    @BeforeEach
    void setUp() {
        // Set up test data
        currentPeriod = YearMonth.now();

        department = new Department();
        department.setId(1L);
        department.setName("IT Department");

        employee = new Employee();
        employee.setId(1L);
        employee.setEmployeeNumber("EMP001");
        employee.setName("John Doe");
        employee.setDepartment(department);
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setSalary(new BigDecimal("5000.00"));

        payrollLedger = new PayrollLedger();
        payrollLedger.setId(1L);
        payrollLedger.setEmployee(employee);
        payrollLedger.setPayPeriod(currentPeriod);
        payrollLedger.setBaseSalary(new BigDecimal("5000.00"));
        payrollLedger.setOvertimePay(new BigDecimal("500.00"));
        payrollLedger.setBonus(new BigDecimal("1000.00"));
        payrollLedger.setAllowances(new BigDecimal("300.00"));
        payrollLedger.setTaxDeductions(new BigDecimal("1000.00"));
        payrollLedger.setInsuranceDeductions(new BigDecimal("200.00"));
        payrollLedger.setOtherDeductions(new BigDecimal("100.00"));
        payrollLedger.setNetSalary(new BigDecimal("5500.00"));
        payrollLedger.setStatus(PayrollStatus.DRAFT);

        payrollLedgerDTO = new PayrollLedgerDTO();
        payrollLedgerDTO.setId(1L);
        payrollLedgerDTO.setEmployeeId(1L);
        payrollLedgerDTO.setPayPeriod(currentPeriod);
        payrollLedgerDTO.setBaseSalary(new BigDecimal("5000.00"));
        payrollLedgerDTO.setOvertimePay(new BigDecimal("500.00"));
        payrollLedgerDTO.setBonus(new BigDecimal("1000.00"));
        payrollLedgerDTO.setAllowances(new BigDecimal("300.00"));
        payrollLedgerDTO.setTaxDeductions(new BigDecimal("1000.00"));
        payrollLedgerDTO.setInsuranceDeductions(new BigDecimal("200.00"));
        payrollLedgerDTO.setOtherDeductions(new BigDecimal("100.00"));
        payrollLedgerDTO.setNetSalary(new BigDecimal("5500.00"));
        payrollLedgerDTO.setStatus(PayrollStatus.DRAFT);
    }

    @Test
    void createPayrollLedger_ShouldCreateAndReturnPayrollLedger() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(payrollRepository.existsByEmployee_IdAndPayPeriod(1L, currentPeriod)).thenReturn(false);
        when(payrollRepository.save(any())).thenReturn(payrollLedger);

        // Act
        PayrollLedgerDTO result = payrollService.createPayrollLedger(payrollLedgerDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(1L, result.getEmployeeId());
        assertEquals(currentPeriod, result.getPayPeriod());
        assertEquals(new BigDecimal("5500.00"), result.getNetSalary());
        assertEquals(PayrollStatus.DRAFT, result.getStatus());

        verify(employeeRepository).findById(1L);
        verify(payrollRepository).existsByEmployee_IdAndPayPeriod(1L, currentPeriod);
        verify(payrollRepository).save(any());
    }

    @Test
    void createPayrollLedger_WithExistingLedger_ShouldThrowException() {
        // Arrange
        when(payrollRepository.existsByEmployee_IdAndPayPeriod(1L, currentPeriod)).thenReturn(true);

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            payrollService.createPayrollLedger(payrollLedgerDTO);
        });

        verify(payrollRepository).existsByEmployee_IdAndPayPeriod(1L, currentPeriod);
        verify(employeeRepository, never()).findById(anyLong());
        verify(payrollRepository, never()).save(any());
    }

    @Test
    void getPayrollLedger_WithValidId_ShouldReturnPayrollLedger() {
        // Arrange
        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));

        // Act
        PayrollLedgerDTO result = payrollService.getPayrollLedger(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(1L, result.getEmployeeId());
        assertEquals(currentPeriod, result.getPayPeriod());
        assertEquals(new BigDecimal("5500.00"), result.getNetSalary());

        verify(payrollRepository).findById(1L);
    }

    @Test
    void getPayrollLedger_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(payrollRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            payrollService.getPayrollLedger(99L);
        });

        verify(payrollRepository).findById(99L);
    }

    @Test
    void updatePayrollLedger_WithValidIdAndModifiableStatus_ShouldUpdateAndReturnPayrollLedger() {
        // Arrange
        PayrollLedgerDTO updateDTO = new PayrollLedgerDTO();
        updateDTO.setBaseSalary(new BigDecimal("5500.00"));
        updateDTO.setOvertimePay(new BigDecimal("600.00"));
        updateDTO.setBonus(new BigDecimal("1200.00"));
        updateDTO.setAllowances(new BigDecimal("350.00"));
        updateDTO.setTaxDeductions(new BigDecimal("1100.00"));
        updateDTO.setInsuranceDeductions(new BigDecimal("220.00"));
        updateDTO.setOtherDeductions(new BigDecimal("120.00"));
        updateDTO.setNetSalary(new BigDecimal("6210.00"));
        updateDTO.setNotes("Updated payroll");

        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));
        when(payrollRepository.save(any())).thenReturn(payrollLedger);

        // Act
        PayrollLedgerDTO result = payrollService.updatePayrollLedger(1L, updateDTO);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());

        verify(payrollRepository).findById(1L);
        verify(payrollRepository).save(any());
    }

    @Test
    void updatePayrollLedger_WithNonModifiableStatus_ShouldThrowException() {
        // Arrange
        payrollLedger.setStatus(PayrollStatus.PAID);

        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            payrollService.updatePayrollLedger(1L, payrollLedgerDTO);
        });

        verify(payrollRepository).findById(1L);
        verify(payrollRepository, never()).save(any());
    }

    @Test
    void deletePayrollLedger_WithDraftStatus_ShouldDeletePayrollLedger() {
        // Arrange
        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));
        doNothing().when(payrollRepository).delete(any(PayrollLedger.class));

        // Act
        payrollService.deletePayrollLedger(1L);

        // Assert
        verify(payrollRepository).findById(1L);
        verify(payrollRepository).delete(payrollLedger);
    }

    @Test
    void deletePayrollLedger_WithNonDraftStatus_ShouldThrowException() {
        // Arrange
        payrollLedger.setStatus(PayrollStatus.APPROVED);

        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            payrollService.deletePayrollLedger(1L);
        });

        verify(payrollRepository).findById(1L);
        verify(payrollRepository, never()).delete(any(PayrollLedger.class));
    }

    @Test
    void getAllPayrollLedgers_ShouldReturnPageOfPayrollLedgers() {
        // Arrange
        List<PayrollLedger> payrollLedgers = List.of(payrollLedger);
        Page<PayrollLedger> page = new PageImpl<>(payrollLedgers);
        Pageable pageable = PageRequest.of(0, 10);

        when(payrollRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<PayrollLedgerDTO> result = payrollService.getAllPayrollLedgers(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());

        verify(payrollRepository).findAll(pageable);
    }

    @SuppressWarnings("unchecked")
    @Test
    void searchPayrollLedgers_ShouldReturnMatchingPayrollLedgers() {
        // Arrange
        List<PayrollLedger> payrollLedgers = List.of(payrollLedger);
        Page<PayrollLedger> page = new PageImpl<>(payrollLedgers);
        Pageable pageable = PageRequest.of(0, 10);
        PayrollSearchCriteria criteria = new PayrollSearchCriteria();
        criteria.setEmployeeId(1L);
        criteria.setPayPeriod(currentPeriod);

        when(payrollRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        // Act
        Page<PayrollLedgerDTO> result = payrollService.searchPayrollLedgers(criteria, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());

        verify(payrollRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void getPayrollLedgersByEmployee_WithValidEmployeeId_ShouldReturnPayrollLedgers() {
        // Arrange
        List<PayrollLedger> payrollLedgers = List.of(payrollLedger);
        Page<PayrollLedger> page = new PageImpl<>(payrollLedgers);
        Pageable pageable = PageRequest.of(0, 10);

        when(employeeRepository.existsById(1L)).thenReturn(true);
        when(payrollRepository.findByEmployee_Id(1L, pageable)).thenReturn(page);

        // Act
        Page<PayrollLedgerDTO> result = payrollService.getPayrollLedgersByEmployee(1L, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getEmployeeId());

        verify(employeeRepository).existsById(1L);
        verify(payrollRepository).findByEmployee_Id(1L, pageable);
    }

    @Test
    void getPayrollLedgersByEmployee_WithInvalidEmployeeId_ShouldThrowException() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        when(employeeRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            payrollService.getPayrollLedgersByEmployee(99L, pageable);
        });

        verify(employeeRepository).existsById(99L);
        verify(payrollRepository, never()).findByEmployee_Id(anyLong(), any(Pageable.class));
    }

    @Test
    void calculatePayroll_ShouldReturnCalculatedPayrollLedger() {
        // Arrange
        PayrollLedgerDTO inputDTO = new PayrollLedgerDTO();
        inputDTO.setEmployeeId(1L);
        inputDTO.setPayPeriod(currentPeriod);
        inputDTO.setBaseSalary(new BigDecimal("5000.00"));
        inputDTO.setOvertimePay(new BigDecimal("500.00"));
        inputDTO.setBonus(new BigDecimal("1000.00"));
        inputDTO.setAllowances(new BigDecimal("300.00"));
        inputDTO.setTaxDeductions(new BigDecimal("1000.00"));
        inputDTO.setInsuranceDeductions(new BigDecimal("200.00"));
        inputDTO.setOtherDeductions(new BigDecimal("100.00"));
        // Net salary will be calculated

        // Act
        PayrollLedgerDTO result = payrollService.calculatePayroll(inputDTO);

        // Assert
        assertNotNull(result);
        assertEquals(new BigDecimal("5500.00"), result.getNetSalary());
        assertEquals(PayrollStatus.CALCULATED, result.getStatus());
    }

    @Test
    void validatePayrollCalculations_WithValidCalculations_ShouldReturnTrue() {
        // Arrange
        PayrollLedgerDTO validDTO = new PayrollLedgerDTO();
        validDTO.setBaseSalary(new BigDecimal("5000.00"));
        validDTO.setOvertimePay(new BigDecimal("500.00"));
        validDTO.setBonus(new BigDecimal("1000.00"));
        validDTO.setAllowances(new BigDecimal("300.00"));
        validDTO.setTaxDeductions(new BigDecimal("1000.00"));
        validDTO.setInsuranceDeductions(new BigDecimal("200.00"));
        validDTO.setOtherDeductions(new BigDecimal("100.00"));
        validDTO.setNetSalary(new BigDecimal("5500.00"));

        // Act
        boolean result = payrollService.validatePayrollCalculations(validDTO);

        // Assert
        assertTrue(result);
    }

    @Test
    void validatePayrollCalculations_WithInvalidCalculations_ShouldReturnFalse() {
        // Arrange
        PayrollLedgerDTO invalidDTO = new PayrollLedgerDTO();
        invalidDTO.setBaseSalary(new BigDecimal("5000.00"));
        invalidDTO.setOvertimePay(new BigDecimal("500.00"));
        invalidDTO.setBonus(new BigDecimal("1000.00"));
        invalidDTO.setAllowances(new BigDecimal("300.00"));
        invalidDTO.setTaxDeductions(new BigDecimal("1000.00"));
        invalidDTO.setInsuranceDeductions(new BigDecimal("200.00"));
        invalidDTO.setOtherDeductions(new BigDecimal("100.00"));
        invalidDTO.setNetSalary(new BigDecimal("6000.00")); // Incorrect net salary

        // Act
        boolean result = payrollService.validatePayrollCalculations(invalidDTO);

        // Assert
        assertFalse(result);
    }

    @Test
    void updatePayrollStatus_WithValidTransition_ShouldUpdateStatus() {
        // Arrange
        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));
        when(payrollRepository.save(any())).thenReturn(payrollLedger);

        // Act
        PayrollLedgerDTO result = payrollService.updatePayrollStatus(1L, PayrollStatus.CALCULATED);

        // Assert
        assertNotNull(result);
        assertEquals(PayrollStatus.CALCULATED, result.getStatus());

        verify(payrollRepository).findById(1L);
        verify(payrollRepository).save(any());
    }

    @Test
    void updatePayrollStatus_WithInvalidTransition_ShouldThrowException() {
        // Arrange
        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            payrollService.updatePayrollStatus(1L, PayrollStatus.PAID);
        });

        verify(payrollRepository).findById(1L);
        verify(payrollRepository, never()).save(any());
    }

    @Test
    void processPayment_WithApprovedStatus_ShouldProcessPayment() {
        // Arrange
        payrollLedger.setStatus(PayrollStatus.APPROVED);

        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));
        when(payrollRepository.save(any())).thenReturn(payrollLedger);

        // Act
        PayrollLedgerDTO result = payrollService.processPayment(1L, "PAY-REF-001");

        // Assert
        assertNotNull(result);
        assertEquals(PayrollStatus.PAID, result.getStatus());
        assertEquals("PAY-REF-001", result.getPaymentReference());
        assertNotNull(result.getPaymentDate());

        verify(payrollRepository).findById(1L);
        verify(payrollRepository).save(any());
    }

    @Test
    void processPayment_WithNonApprovedStatus_ShouldThrowException() {
        // Arrange
        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payrollLedger));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            payrollService.processPayment(1L, "PAY-REF-001");
        });

        verify(payrollRepository).findById(1L);
        verify(payrollRepository, never()).save(any());
    }

    @Test
    void getPayrollStatsByDepartment_ShouldReturnDepartmentStats() {
        // Arrange
        List<Object[]> statsData = new ArrayList<>();
        statsData.add(new Object[] { "IT Department", 5L, new BigDecimal("25000.00") });
        statsData.add(new Object[] { "HR Department", 3L, new BigDecimal("15000.00") });

        when(payrollRepository.getPayrollStatsByDepartment(currentPeriod)).thenReturn(statsData);

        // Act
        List<Map<String, Object>> result = payrollService.getPayrollStatsByDepartment(currentPeriod);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("IT Department", result.get(0).get("departmentName"));
        assertEquals(5L, result.get(0).get("count"));
        assertEquals(new BigDecimal("25000.00"), result.get(0).get("totalAmount"));

        verify(payrollRepository).getPayrollStatsByDepartment(currentPeriod);
    }

    @Test
    void generatePayrollLedgers_ShouldGenerateLedgersForActiveEmployees() {
        // Arrange
        List<Employee> activeEmployees = new ArrayList<>();
        activeEmployees.add(employee);

        Employee employee2 = new Employee();
        employee2.setId(2L);
        employee2.setEmployeeNumber("EMP002");
        employee2.setName("Jane Smith");
        employee2.setDepartment(department);
        employee2.setStatus(EmployeeStatus.ACTIVE);
        employee2.setSalary(new BigDecimal("6000.00"));
        activeEmployees.add(employee2);

        when(employeeRepository.findAll()).thenReturn(activeEmployees);
        when(payrollRepository.existsByEmployee_IdAndPayPeriod(1L, currentPeriod)).thenReturn(false);
        when(payrollRepository.existsByEmployee_IdAndPayPeriod(2L, currentPeriod)).thenReturn(false);
        when(payrollRepository.save(any())).thenReturn(payrollLedger);

        // Act
        List<PayrollLedgerDTO> result = payrollService.generatePayrollLedgers(currentPeriod);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());

        verify(employeeRepository).findAll();
        verify(payrollRepository, times(2)).save(any());
    }

    @Test
    void generatePayrollLedger_ShouldGenerateLedgerForEmployee() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(payrollRepository.existsByEmployee_IdAndPayPeriod(1L, currentPeriod)).thenReturn(false);
        when(payrollRepository.save(any())).thenReturn(payrollLedger);

        // Act
        PayrollLedgerDTO result = payrollService.generatePayrollLedger(1L, currentPeriod);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getEmployeeId());
        assertEquals(currentPeriod, result.getPayPeriod());
        assertEquals(PayrollStatus.DRAFT, result.getStatus());

        verify(employeeRepository).findById(1L);
        verify(payrollRepository).existsByEmployee_IdAndPayPeriod(1L, currentPeriod);
        verify(payrollRepository).save(any());
    }

    @Test
    void generatePayrollLedger_WithExistingLedger_ShouldThrowException() {
        // Arrange
        // We need to set up the mock before the exception is thrown
        when(payrollRepository.existsByEmployee_IdAndPayPeriod(1L, currentPeriod)).thenReturn(true);
        
        // The findById should not be called because the method should throw an exception
        // before reaching that point, so we don't need to mock it

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            payrollService.generatePayrollLedger(1L, currentPeriod);
        });

        // Verify that existsByEmployee_IdAndPayPeriod was called
        verify(payrollRepository).existsByEmployee_IdAndPayPeriod(1L, currentPeriod);
        
        // Verify that findById and save were never called
        verify(employeeRepository, never()).findById(anyLong());
        verify(payrollRepository, never()).save(any());
    }
}
