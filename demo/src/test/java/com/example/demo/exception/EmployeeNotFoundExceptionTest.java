package com.example.demo.exception;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class EmployeeNotFoundExceptionTest {

    @Test
    void shouldCreateExceptionWithMessage() {
        // Given
        String message = "Employee not found";
        
        // When
        EmployeeNotFoundException exception = new EmployeeNotFoundException(message);
        
        // Then
        assertEquals(message, exception.getMessage());
        assertEquals("EMP-404", exception.getErrorCode());
    }
    
    @Test
    void shouldCreateExceptionWithEmployeeId() {
        // Given
        Long employeeId = 123L;
        
        // When
        EmployeeNotFoundException exception = new EmployeeNotFoundException(employeeId);
        
        // Then
        assertEquals("Employee not found with id: 123", exception.getMessage());
        assertEquals("EMP-404", exception.getErrorCode());
    }
    
    @Test
    void shouldCreateExceptionWithFieldNameAndValue() {
        // Given
        String fieldName = "email";
        String fieldValue = "test@example.com";
        
        // When
        EmployeeNotFoundException exception = new EmployeeNotFoundException(fieldName, fieldValue);
        
        // Then
        assertEquals("Employee not found with email: 'test@example.com'", exception.getMessage());
        assertEquals("EMP-404", exception.getErrorCode());
    }
}