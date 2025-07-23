package com.example.demo.model.entity;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * Test class for Position entity validation
 */
public class PositionTest {

    private Validator validator;
    private Department department;

    @BeforeEach
    public void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        // Create a test department
        department = new Department();
        department.setId(1L);
        department.setName("Test Department");
    }

    @Test
    public void testValidPosition() {
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(department);
        position.setSalaryMin(50000.0);
        position.setSalaryMax(100000.0);
        position.setIsActive(true);

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertTrue(violations.isEmpty(), "Valid position should not have validation errors");
    }

    @Test
    public void testInvalidJobTitle() {
        Position position = new Position();
        position.setJobTitle(""); // Empty job title
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(department);
        // Set audit fields to avoid validation errors for those
        position.setCreatedAt(LocalDateTime.now());
        position.setCreatedBy("test-user");

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertFalse(violations.isEmpty(), "Empty job title should cause validation error");

        // Check if there's a validation error for job title
        boolean hasJobTitleError = violations.stream()
                .anyMatch(v -> v.getMessage().equals("Job title is required"));
        assertTrue(hasJobTitleError, "Should have a validation error for job title");
    }

    @Test
    public void testJobTitleTooShort() {
        Position position = new Position();
        position.setJobTitle("A"); // Too short
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(department);

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertFalse(violations.isEmpty(), "Job title too short should cause validation error");
        assertEquals(1, violations.size(), "Should have exactly one validation error");
        assertEquals("Job title must be between 2 and 100 characters", violations.iterator().next().getMessage());
    }

    @Test
    public void testJobTitleTooLong() {
        Position position = new Position();
        position.setJobTitle("A".repeat(101)); // 101 characters
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(department);

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertFalse(violations.isEmpty(), "Job title too long should cause validation error");
        assertEquals(1, violations.size(), "Should have exactly one validation error");
        assertEquals("Job title must be between 2 and 100 characters", violations.iterator().next().getMessage());
    }

    @Test
    public void testProfessionalTitleTooLong() {
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setProfessionalTitle("A".repeat(101)); // 101 characters
        position.setDescription("Develops software applications");
        position.setDepartment(department);

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertFalse(violations.isEmpty(), "Professional title too long should cause validation error");
        assertEquals(1, violations.size(), "Should have exactly one validation error");
        assertEquals("Professional title cannot exceed 100 characters", violations.iterator().next().getMessage());
    }

    @Test
    public void testDescriptionTooLong() {
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("A".repeat(256)); // 256 characters
        position.setDepartment(department);

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertFalse(violations.isEmpty(), "Description too long should cause validation error");
        assertEquals(1, violations.size(), "Should have exactly one validation error");
        assertEquals("Description cannot exceed 255 characters", violations.iterator().next().getMessage());
    }

    @Test
    public void testNullDepartment() {
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(null); // Null department

        Set<ConstraintViolation<Position>> violations = validator.validate(position);
        assertFalse(violations.isEmpty(), "Null department should cause validation error");
        assertEquals(1, violations.size(), "Should have exactly one validation error");
        assertEquals("Department is required", violations.iterator().next().getMessage());
    }

    @Test
    public void testValidSalaryRange() {
        Position position = new Position();
        position.setSalaryMin(50000.0);
        position.setSalaryMax(100000.0);

        assertTrue(position.isValidSalaryRange(), "Valid salary range should return true");
    }

    @Test
    public void testInvalidSalaryRange() {
        Position position = new Position();
        position.setSalaryMin(100000.0);
        position.setSalaryMax(50000.0);

        assertFalse(position.isValidSalaryRange(), "Invalid salary range should return false");
    }

    @Test
    public void testNullSalaryRange() {
        Position position = new Position();
        position.setSalaryMin(null);
        position.setSalaryMax(null);

        assertTrue(position.isValidSalaryRange(), "Null salary range should be considered valid");
    }

    @Test
    public void testHasEmployees() {
        Position position = new Position();
        position.setEmployees(new ArrayList<>());

        assertFalse(position.hasEmployees(), "Position with empty employee list should return false");

        Employee employee = new Employee();
        position.getEmployees().add(employee);

        assertTrue(position.hasEmployees(), "Position with employees should return true");
    }

    @Test
    public void testBuilderPattern() {
        Position position = Position.builder()
                .jobTitle("Software Engineer")
                .professionalTitle("Senior Developer")
                .description("Develops software applications")
                .department(department)
                .salaryMin(50000.0)
                .salaryMax(100000.0)
                .isActive(true)
                .build();

        assertEquals("Software Engineer", position.getJobTitle());
        assertEquals("Senior Developer", position.getProfessionalTitle());
        assertEquals("Develops software applications", position.getDescription());
        assertEquals(department, position.getDepartment());
        assertEquals(50000.0, position.getSalaryMin());
        assertEquals(100000.0, position.getSalaryMax());
        assertTrue(position.getIsActive());
    }
}