package com.example.demo.exception;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class BaseExceptionTest {

    private static class TestException extends BaseException {
        private static final long serialVersionUID = 1L;
        
        public TestException(String message, String errorCode) {
            super(message, errorCode);
        }
        
        public TestException(String message, String errorCode, Throwable cause) {
            super(message, errorCode, cause);
        }
    }
    
    @Test
    void shouldStoreErrorCode() {
        // Given
        String errorCode = "TEST-123";
        String message = "Test message";
        
        // When
        BaseException exception = new TestException(message, errorCode);
        
        // Then
        assertEquals(errorCode, exception.getErrorCode());
        assertEquals(message, exception.getMessage());
    }
    
    @Test
    void shouldStoreCause() {
        // Given
        String errorCode = "TEST-123";
        String message = "Test message";
        Throwable cause = new RuntimeException("Original cause");
        
        // When
        BaseException exception = new TestException(message, errorCode, cause);
        
        // Then
        assertEquals(errorCode, exception.getErrorCode());
        assertEquals(message, exception.getMessage());
        assertEquals(cause, exception.getCause());
    }
}