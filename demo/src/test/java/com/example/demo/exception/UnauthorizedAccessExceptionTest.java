package com.example.demo.exception;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class UnauthorizedAccessExceptionTest {

    @Test
    void shouldCreateExceptionWithMessage() {
        // Given
        String message = "Unauthorized access";
        
        // When
        UnauthorizedAccessException exception = new UnauthorizedAccessException(message);
        
        // Then
        assertEquals(message, exception.getMessage());
        assertEquals("AUTH-403", exception.getErrorCode());
    }
    
    @Test
    void shouldCreateExceptionWithResourceAndOperation() {
        // Given
        String resource = "Employee";
        String operation = "DELETE";
        
        // When
        UnauthorizedAccessException exception = new UnauthorizedAccessException(resource, operation);
        
        // Then
        assertEquals("Unauthorized access: Cannot perform 'DELETE' operation on 'Employee'", exception.getMessage());
        assertEquals("AUTH-403", exception.getErrorCode());
    }
}