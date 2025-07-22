package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import com.example.demo.model.entity.Position;
import com.example.demo.repository.specification.EmployeeSpecification;

@DataJpaTest
@ActiveProfiles("test")
public class EmployeeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EmployeeRepository employeeRepository;

    private Department itDepartment;
    private Department hrDepartment;
    private Position developerPosition;
    private Position managerPosition;
    private Employee employee1;
    private Employee employee2;
    private Employee employee3;

    @BeforeEach
    void setUp() {
        // Create departments
        itDepartment = new Department();
        itDepartment.setName("IT Department");
        itDepartment.setDescription("Information Technology Department");
        itDepartment = entityManager.persistAndFlush(itDepartment);

        hrDepartment = new Department();
        hrDepartment.setName("HR Department");
        hrDepartment.setDescription("Human Resources Department");
        hrDepartment = entityManager.persistAndFlush(hrDepartment);

        // Create positions
        developerPosition = new Position();
        developerPosition.setJobTitle("Software Developer");
        developerPosition.setDescription("Develops software applications");
        developerPosition = entityManager.persistAndFlush(developerPosition);

        managerPosition = new Position();
        managerPosition.setJobTitle("Department Manager");
        managerPosition.setDescription("Manages department operations");
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
        entityManager.persistAndFlush(employee2);

        employee3 = Employee.builder()
                .employeeNumber("EMP003")
                .name("Robert Johnson")
                .email("robert.johnson@example.com")
                .phone("+1122334455")
                .department(itDepartment)
                .position(developerPosition)
                .hireDate(LocalDate.of(2021, 6, 5))
                .status(EmployeeStatus.ON_LEAVE)
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(1990, 2, 10))
                .address("789 Pine St, Village")
                .salary(new BigDecimal("70000.00"))
                .build();
        entityManager.persistAndFlush(employee3);
    }

    @Test
    void findByEmployeeNumber_ShouldReturnEmployee() {
        // Act
        Optional<Employee> result = employeeRepository.findByEmployeeNumber("EMP001");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("John Doe", result.get().getName());
    }

    @Test
    void findByEmail_ShouldReturnEmployee() {
        // Act
        Optional<Employee> result = employeeRepository.findByEmail("jane.smith@example.com");

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Jane Smith", result.get().getName());
    }

    @Test
    void existsByEmployeeNumber_WithExistingNumber_ShouldReturnTrue() {
        // Act
        boolean exists = employeeRepository.existsByEmployeeNumber("EMP002");

        // Assert
        assertTrue(exists);
    }

    @Test
    void existsByEmployeeNumber_WithNonExistingNumber_ShouldReturnFalse() {
        // Act
        boolean exists = employeeRepository.existsByEmployeeNumber("NONEXISTENT");

        // Assert
        assertFalse(exists);
    }

    @Test
    void findByDepartmentId_ShouldReturnEmployeesInDepartment() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByDepartmentId(itDepartment.getId(), pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(e -> e.getDepartment().getId().equals(itDepartment.getId())));
    }

    @Test
    void findByPositionId_ShouldReturnEmployeesWithPosition() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByPositionId(developerPosition.getId(), pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(e -> e.getPosition().getId().equals(developerPosition.getId())));
    }

    @Test
    void findByStatus_ShouldReturnEmployeesWithStatus() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByStatus(EmployeeStatus.ACTIVE, pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(e -> e.getStatus() == EmployeeStatus.ACTIVE));
    }

    @Test
    void findByNameContainingIgnoreCase_ShouldReturnMatchingEmployees() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByNameContainingIgnoreCase("john", pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("John Doe", result.getContent().get(0).getName());
    }

    @Test
    void findByHireDateBetween_ShouldReturnEmployeesHiredInRange() {
        // Arrange
        LocalDate startDate = LocalDate.of(2020, 1, 1);
        LocalDate endDate = LocalDate.of(2020, 12, 31);
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByHireDateBetween(startDate, endDate, pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("John Doe", result.getContent().get(0).getName());
    }

    @Test
    void findByDepartmentNameContainingIgnoreCase_ShouldReturnEmployeesInDepartment() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByDepartmentNameContainingIgnoreCase("hr", pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("Jane Smith", result.getContent().get(0).getName());
    }

    @Test
    void findByPositionJobTitleContainingIgnoreCase_ShouldReturnEmployeesWithPosition() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Employee> result = employeeRepository.findByPositionJobTitleContainingIgnoreCase("developer", pageable);

        // Assert
        assertEquals(2, result.getTotalElements());
        assertTrue(result.getContent().stream()
                .allMatch(e -> e.getPosition().getJobTitle().toLowerCase().contains("developer")));
    }

    @Test
    void findByAdvancedSearch_WithMultipleCriteria_ShouldReturnMatchingEmployees() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        String name = "John";
        EmployeeStatus status = EmployeeStatus.ACTIVE;

        // Act
        Page<Employee> result = employeeRepository.findByAdvancedSearch(
                name, null, null, null, status, null, null, pageable);

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("John Doe", result.getContent().get(0).getName());
        assertEquals(EmployeeStatus.ACTIVE, result.getContent().get(0).getStatus());
    }

    @Test
    void countByDepartmentId_ShouldReturnCorrectCount() {
        // Act
        long count = employeeRepository.countByDepartmentId(itDepartment.getId());

        // Assert
        assertEquals(2, count);
    }

    @Test
    void countByPositionId_ShouldReturnCorrectCount() {
        // Act
        long count = employeeRepository.countByPositionId(developerPosition.getId());

        // Assert
        assertEquals(2, count);
    }

    @Test
    void countByStatus_ShouldReturnCorrectCount() {
        // Act
        long count = employeeRepository.countByStatus(EmployeeStatus.ON_LEAVE);

        // Assert
        assertEquals(1, count);
    }

    @Test
    void findByIdIn_ShouldReturnMatchingEmployees() {
        // Act
        List<Employee> result = employeeRepository.findByIdIn(List.of(employee1.getId(), employee3.getId()));

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream()
                .anyMatch(e -> e.getId().equals(employee1.getId())));
        assertTrue(result.stream()
                .anyMatch(e -> e.getId().equals(employee3.getId())));
    }

    @Test
    void getEmployeeCountByDepartment_ShouldReturnCorrectStatistics() {
        // Act
        List<Object[]> result = employeeRepository.getEmployeeCountByDepartment();

        // Assert
        assertEquals(2, result.size());
        
        // Find IT department stats (should have 2 employees)
        Object[] itStats = result.stream()
                .filter(stats -> stats[0].equals(itDepartment.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(itStats);
        assertEquals(2L, itStats[1]);
        
        // Find HR department stats (should have 1 employee)
        Object[] hrStats = result.stream()
                .filter(stats -> stats[0].equals(hrDepartment.getName()))
                .findFirst()
                .orElse(null);
        assertNotNull(hrStats);
        assertEquals(1L, hrStats[1]);
    }

    @Test
    void getEmployeeCountByStatus_ShouldReturnCorrectStatistics() {
        // Act
        List<Object[]> result = employeeRepository.getEmployeeCountByStatus();

        // Assert
        assertEquals(2, result.size());
        
        // Find ACTIVE status stats (should have 2 employees)
        Object[] activeStats = result.stream()
                .filter(stats -> stats[0].equals(EmployeeStatus.ACTIVE))
                .findFirst()
                .orElse(null);
        assertNotNull(activeStats);
        assertEquals(2L, activeStats[1]);
        
        // Find ON_LEAVE status stats (should have 1 employee)
        Object[] onLeaveStats = result.stream()
                .filter(stats -> stats[0].equals(EmployeeStatus.ON_LEAVE))
                .findFirst()
                .orElse(null);
        assertNotNull(onLeaveStats);
        assertEquals(1L, onLeaveStats[1]);
    }

    @Test
    void testEmployeeSpecification_WithMultipleCriteria() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10, Sort.by("name").ascending());
        
        Specification<Employee> spec = Specification.where(
                EmployeeSpecification.isActive())
                .and(EmployeeSpecification.inDepartment(itDepartment.getId()));
        
        // Act
        Page<Employee> result = employeeRepository.findAll(spec, pageable);
        
        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals("John Doe", result.getContent().get(0).getName());
    }
}