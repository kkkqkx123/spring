package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
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

import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.EmployeeNotFoundException;
import com.example.demo.exception.InvalidDataException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.Employee.Gender;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.service.impl.EmployeeServiceImpl;

@ExtendWith(MockitoExtension.class)
public class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private Employee employee1;
    private Employee employee2;
    private Department department;
    private Position position;
    private List<Employee> employeeList;
    private Page<Employee> employeePage;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        // Create test data
        department = new Department();
        department.setId(1L);
        department.setName("IT Department");

        position = new Position();
        position.setId(1L);
        position.setJobTitle("Software Engineer");

        employee1 = Employee.builder()
                .id(1L)
                .employeeNumber("EMP001")
                .name("John Doe")
                .email("john.doe@example.com")
                .phone("+1234567890")
                .department(department)
                .position(position)
                .hireDate(LocalDate.of(2020, 1, 15))
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.MALE)
                .salary(new BigDecimal("75000.00"))
                .build();

        employee2 = Employee.builder()
                .id(2L)
                .employeeNumber("EMP002")
                .name("Jane Smith")
                .email("jane.smith@example.com")
                .phone("+1987654321")
                .department(department)
                .position(position)
                .hireDate(LocalDate.of(2021, 3, 10))
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.FEMALE)
                .salary(new BigDecimal("80000.00"))
                .build();

        employeeList = Arrays.asList(employee1, employee2);
        pageable = PageRequest.of(0, 10);
        employeePage = new PageImpl<>(employeeList, pageable, employeeList.size());
    }

    @Test
    void getAllEmployees_ShouldReturnPageOfEmployees() {
        // Arrange
        when(employeeRepository.findAll(pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeService.getAllEmployees(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        assertEquals(employeeList, result.getContent());
        verify(employeeRepository).findAll(pageable);
    }

    @Test
    void getEmployeeById_WithValidId_ShouldReturnEmployee() {
        // Arrange
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee1));

        // Act
        Employee result = employeeService.getEmployeeById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(employee1.getId(), result.getId());
        assertEquals(employee1.getName(), result.getName());
        verify(employeeRepository).findById(1L);
    }

    @Test
    void getEmployeeById_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EmployeeNotFoundException.class, () -> {
            employeeService.getEmployeeById(99L);
        });
        verify(employeeRepository).findById(99L);
    }

    @Test
    void getEmployeeByEmployeeNumber_WithValidNumber_ShouldReturnEmployee() {
        // Arrange
        when(employeeRepository.findByEmployeeNumber("EMP001")).thenReturn(Optional.of(employee1));

        // Act
        Employee result = employeeService.getEmployeeByEmployeeNumber("EMP001");

        // Assert
        assertNotNull(result);
        assertEquals(employee1.getEmployeeNumber(), result.getEmployeeNumber());
        assertEquals(employee1.getName(), result.getName());
        verify(employeeRepository).findByEmployeeNumber("EMP001");
    }

    @Test
    void getEmployeeByEmployeeNumber_WithInvalidNumber_ShouldThrowException() {
        // Arrange
        when(employeeRepository.findByEmployeeNumber("INVALID")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            employeeService.getEmployeeByEmployeeNumber("INVALID");
        });
        verify(employeeRepository).findByEmployeeNumber("INVALID");
    }

    @Test
    void createEmployee_WithValidData_ShouldReturnCreatedEmployee() {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeNumber("EMP003")
                .name("New Employee")
                .email("new.employee@example.com")
                .department(department)
                .status(EmployeeStatus.ACTIVE)
                .build();

        when(employeeRepository.existsByEmployeeNumber("EMP003")).thenReturn(false);
        when(employeeRepository.existsByEmail("new.employee@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenReturn(newEmployee);

        // Act
        Employee result = employeeService.createEmployee(newEmployee);

        // Assert
        assertNotNull(result);
        assertEquals(newEmployee.getEmployeeNumber(), result.getEmployeeNumber());
        assertEquals(newEmployee.getName(), result.getName());
        verify(employeeRepository).existsByEmployeeNumber("EMP003");
        verify(employeeRepository).existsByEmail("new.employee@example.com");
        verify(employeeRepository).save(newEmployee);
    }

    @Test
    void createEmployee_WithDuplicateEmployeeNumber_ShouldThrowException() {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeNumber("EMP001") // Duplicate employee number
                .name("New Employee")
                .email("new.employee@example.com")
                .department(department)
                .status(EmployeeStatus.ACTIVE)
                .build();

        when(employeeRepository.existsByEmployeeNumber("EMP001")).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> {
            employeeService.createEmployee(newEmployee);
        });
        verify(employeeRepository).existsByEmployeeNumber("EMP001");
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createEmployee_WithDuplicateEmail_ShouldThrowException() {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeNumber("EMP003")
                .name("New Employee")
                .email("john.doe@example.com") // Duplicate email
                .department(department)
                .status(EmployeeStatus.ACTIVE)
                .build();

        when(employeeRepository.existsByEmployeeNumber("EMP003")).thenReturn(false);
        when(employeeRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> {
            employeeService.createEmployee(newEmployee);
        });
        verify(employeeRepository).existsByEmployeeNumber("EMP003");
        verify(employeeRepository).existsByEmail("john.doe@example.com");
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void createEmployee_WithInvalidData_ShouldThrowException() {
        // Arrange
        Employee invalidEmployee = Employee.builder()
                .employeeNumber("") // Empty employee number
                .name("New Employee")
                .email("new.employee@example.com")
                .department(department)
                .status(EmployeeStatus.ACTIVE)
                .build();

        // Act & Assert
        assertThrows(InvalidDataException.class, () -> {
            employeeService.createEmployee(invalidEmployee);
        });
        verify(employeeRepository, never()).existsByEmployeeNumber(anyString());
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void updateEmployee_WithValidData_ShouldReturnUpdatedEmployee() {
        // Arrange
        Employee updatedDetails = Employee.builder()
                .employeeNumber("EMP001")
                .name("Updated Name")
                .email("updated.email@example.com")
                .phone("+1234567890")
                .department(department)
                .position(position)
                .hireDate(LocalDate.of(2020, 1, 15))
                .status(EmployeeStatus.ACTIVE)
                .build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee1));
        when(employeeRepository.existsByEmail("updated.email@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Employee result = employeeService.updateEmployee(1L, updatedDetails);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        assertEquals("updated.email@example.com", result.getEmail());
        verify(employeeRepository).findById(1L);
        verify(employeeRepository).save(any(Employee.class));
    }

    @Test
    void updateEmployee_WithNonExistentId_ShouldThrowException() {
        // Arrange
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EmployeeNotFoundException.class, () -> {
            employeeService.updateEmployee(99L, employee1);
        });
        verify(employeeRepository).findById(99L);
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void deleteEmployee_WithValidId_ShouldDeleteEmployee() {
        // Arrange
        when(employeeRepository.existsById(1L)).thenReturn(true);
        doNothing().when(employeeRepository).deleteById(1L);

        // Act
        employeeService.deleteEmployee(1L);

        // Assert
        verify(employeeRepository).existsById(1L);
        verify(employeeRepository).deleteById(1L);
    }

    @Test
    void deleteEmployee_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(employeeRepository.existsById(99L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            employeeService.deleteEmployee(99L);
        });
        verify(employeeRepository).existsById(99L);
        verify(employeeRepository, never()).deleteById(anyLong());
    }

    @Test
    void deleteEmployees_WithValidIds_ShouldReturnDeletedCount() {
        // Arrange
        List<Long> ids = Arrays.asList(1L, 2L);
        when(employeeRepository.findByIdIn(ids)).thenReturn(employeeList);
        doNothing().when(employeeRepository).deleteAll(employeeList);

        // Act
        int result = employeeService.deleteEmployees(ids);

        // Assert
        assertEquals(2, result);
        verify(employeeRepository).findByIdIn(ids);
        verify(employeeRepository).deleteAll(employeeList);
    }

    @SuppressWarnings("unchecked")
    @Test
    void searchEmployees_WithValidCriteria_ShouldReturnMatchingEmployees() {
        // Arrange
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria();
        criteria.setDepartmentId(1L);
        criteria.setStatus(EmployeeStatus.ACTIVE);

        when(employeeRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeService.searchEmployees(criteria, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findAll(any(Specification.class), eq(pageable));
    }

    @SuppressWarnings("unchecked")
    @Test
    void searchEmployees_WithInvalidCriteria_ShouldThrowException() {
        // Arrange
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria();
        criteria.setHireDateStart(LocalDate.of(2022, 1, 1));
        criteria.setHireDateEnd(LocalDate.of(2021, 1, 1)); // End date before start date

        // Act & Assert
        assertThrows(InvalidDataException.class, () -> {
            employeeService.searchEmployees(criteria, pageable);
        });
        verify(employeeRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getEmployeesByDepartment_ShouldReturnEmployeesInDepartment() {
        // Arrange
        when(employeeRepository.findByDepartmentId(1L, pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeService.getEmployeesByDepartment(1L, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByDepartmentId(1L, pageable);
    }

    @Test
    void getEmployeesByPosition_ShouldReturnEmployeesWithPosition() {
        // Arrange
        when(employeeRepository.findByPositionId(1L, pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeService.getEmployeesByPosition(1L, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByPositionId(1L, pageable);
    }

    @Test
    void getEmployeesByStatus_ShouldReturnEmployeesWithStatus() {
        // Arrange
        when(employeeRepository.findByStatus(EmployeeStatus.ACTIVE, pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeService.getEmployeesByStatus(EmployeeStatus.ACTIVE, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByStatus(EmployeeStatus.ACTIVE, pageable);
    }

    @Test
    void countByDepartment_ShouldReturnEmployeeCount() {
        // Arrange
        when(employeeRepository.countByDepartmentId(1L)).thenReturn(2L);

        // Act
        long result = employeeService.countByDepartment(1L);

        // Assert
        assertEquals(2L, result);
        verify(employeeRepository).countByDepartmentId(1L);
    }

    @Test
    void countByPosition_ShouldReturnEmployeeCount() {
        // Arrange
        when(employeeRepository.countByPositionId(1L)).thenReturn(2L);

        // Act
        long result = employeeService.countByPosition(1L);

        // Assert
        assertEquals(2L, result);
        verify(employeeRepository).countByPositionId(1L);
    }

    @Test
    void getEmployeeCountByDepartment_ShouldReturnDepartmentStatistics() {
        // Arrange
        List<Object[]> departmentStats = Arrays.asList(
                new Object[]{"IT Department", 2L},
                new Object[]{"HR Department", 1L}
        );
        when(employeeRepository.getEmployeeCountByDepartment()).thenReturn(departmentStats);

        // Act
        List<Object[]> result = employeeService.getEmployeeCountByDepartment();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("IT Department", result.get(0)[0]);
        assertEquals(2L, result.get(0)[1]);
        verify(employeeRepository).getEmployeeCountByDepartment();
    }

    @Test
    void getEmployeeCountByStatus_ShouldReturnStatusStatistics() {
        // Arrange
        List<Object[]> statusStats = Arrays.asList(
                new Object[]{EmployeeStatus.ACTIVE, 2L},
                new Object[]{EmployeeStatus.ON_LEAVE, 1L}
        );
        when(employeeRepository.getEmployeeCountByStatus()).thenReturn(statusStats);

        // Act
        List<Object[]> result = employeeService.getEmployeeCountByStatus();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(EmployeeStatus.ACTIVE, result.get(0)[0]);
        assertEquals(2L, result.get(0)[1]);
        verify(employeeRepository).getEmployeeCountByStatus();
    }
}