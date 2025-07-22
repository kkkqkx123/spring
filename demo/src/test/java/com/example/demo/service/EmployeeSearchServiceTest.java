package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

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

import com.example.demo.exception.InvalidDataException;
import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.Employee.Gender;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.service.impl.EmployeeSearchServiceImpl;

@ExtendWith(MockitoExtension.class)
public class EmployeeSearchServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeSearchServiceImpl employeeSearchService;

    private Employee employee1;
    private Employee employee2;
    private List<Employee> employeeList;
    private Page<Employee> employeePage;
    private Pageable pageable;
    private EmployeeSearchCriteria validCriteria;

    @BeforeEach
    void setUp() {
        // Create test data
        Department department = new Department();
        department.setId(1L);
        department.setName("IT Department");

        Position position = new Position();
        position.setId(1L);
        position.setJobTitle("Software Engineer");

        employee1 = Employee.builder()
                .id(1L)
                .employeeNumber("EMP001")
                .name("John Doe")
                .email("john.doe@example.com")
                .department(department)
                .position(position)
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.MALE)
                .build();

        employee2 = Employee.builder()
                .id(2L)
                .employeeNumber("EMP002")
                .name("Jane Smith")
                .email("jane.smith@example.com")
                .department(department)
                .position(position)
                .status(EmployeeStatus.ACTIVE)
                .gender(Gender.FEMALE)
                .build();

        employeeList = Arrays.asList(employee1, employee2);
        pageable = PageRequest.of(0, 10);
        employeePage = new PageImpl<>(employeeList, pageable, employeeList.size());

        validCriteria = new EmployeeSearchCriteria();
        validCriteria.setName("John");
        validCriteria.setStatus(EmployeeStatus.ACTIVE);
    }

    @Test
    void searchEmployees_WithValidCriteria_ShouldReturnMatchingEmployees() {
        // Arrange
        when(employeeRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeSearchService.searchEmployees(validCriteria, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void searchEmployees_WithNullCriteria_ShouldThrowException() {
        // Act & Assert
        assertThrows(InvalidDataException.class, () -> {
            employeeSearchService.searchEmployees(null, pageable);
        });
        verify(employeeRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void searchEmployees_WithInvalidHireDateRange_ShouldThrowException() {
        // Arrange
        EmployeeSearchCriteria invalidCriteria = new EmployeeSearchCriteria();
        invalidCriteria.setHireDateStart(LocalDate.of(2022, 1, 1));
        invalidCriteria.setHireDateEnd(LocalDate.of(2021, 1, 1)); // End date before start date

        // Act & Assert
        assertThrows(InvalidDataException.class, () -> {
            employeeSearchService.searchEmployees(invalidCriteria, pageable);
        });
        verify(employeeRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void searchByName_ShouldReturnMatchingEmployees() {
        // Arrange
        when(employeeRepository.findByNameContainingIgnoreCase("John", pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeSearchService.searchByName("John", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByNameContainingIgnoreCase("John", pageable);
    }

    @Test
    void searchByEmail_ShouldReturnMatchingEmployees() {
        // Arrange
        when(employeeRepository.findByEmailContainingIgnoreCase("example", pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeSearchService.searchByEmail("example", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByEmailContainingIgnoreCase("example", pageable);
    }

    @Test
    void searchByDepartmentName_ShouldReturnMatchingEmployees() {
        // Arrange
        when(employeeRepository.findByDepartmentNameContainingIgnoreCase("IT", pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeSearchService.searchByDepartmentName("IT", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByDepartmentNameContainingIgnoreCase("IT", pageable);
    }

    @Test
    void searchByJobTitle_ShouldReturnMatchingEmployees() {
        // Arrange
        when(employeeRepository.findByPositionJobTitleContainingIgnoreCase("Engineer", pageable)).thenReturn(employeePage);

        // Act
        Page<Employee> result = employeeSearchService.searchByJobTitle("Engineer", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        verify(employeeRepository).findByPositionJobTitleContainingIgnoreCase("Engineer", pageable);
    }

    @Test
    void clearSearchCache_ShouldNotThrowException() {
        // Act & Assert
        assertDoesNotThrow(() -> {
            employeeSearchService.clearSearchCache(validCriteria);
        });
    }

    @Test
    void clearAllSearchCaches_ShouldNotThrowException() {
        // Act & Assert
        assertDoesNotThrow(() -> {
            employeeSearchService.clearAllSearchCaches();
        });
    }
}