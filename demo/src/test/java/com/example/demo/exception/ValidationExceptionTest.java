package com.example.demo.exception;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

class ValidationExceptionTest {

    @Test
    void shouldCreateExceptionWithMessage() {
        // Given
        String message = "Validation failed";
        
        // When
        ValidationException exception = new ValidationException(message);
        
        // Then
        assertEquals(message, exception.getMessage());
        assertEquals("VAL-400", exception.getErrorCode());
        assertFalse(exception.hasErrors());
        assertTrue(exception.getErrors().isEmpty());
    }
    
    @Test
    void shouldCreateExceptionWithErrorsMap() {
        // Given
        String message = "Validation failed";
        Map<String, String> errors = new HashMap<>();
        errors.put("name", "Name is required");
        errors.put("email", "Email is invalid");
        
        // When
        ValidationException exception = new ValidationException(message, errors);
        
        // Then
        assertEquals(message, exception.getMessage());
        assertEquals("VAL-400", exception.getErrorCode());
        assertTrue(exception.hasErrors());
        assertEquals(2, exception.getErrors().size());
        assertEquals("Name is required", exception.getErrors().get("name"));
        assertEquals("Email is invalid", exception.getErrors().get("email"));
    }
    
    @Test
    void shouldAddErrorsAfterCreation() {
        // Given
        ValidationException exception = new ValidationException("Validation failed");
        
        // When
        exception.addError("name", "Name is required");
        exception.addError("email", "Email is invalid");
        
        // Then
        assertTrue(exception.hasErrors());
        assertEquals(2, exception.getErrors().size());
        assertEquals("Name is required", exception.getErrors().get("name"));
        assertEquals("Email is invalid", exception.getErrors().get("email"));
    }
}