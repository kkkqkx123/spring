package com.example.demo.exception;

/**
 * Custom exception for department-related errors
 */
public class DepartmentException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

    public DepartmentException(String message) {
        super(message);
    }

    public DepartmentException(String message, Throwable cause) {
        super(message, cause);
    }
}