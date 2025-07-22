package com.example.demo.exception;

/**
 * Exception thrown when attempting to create a duplicate resource
 */
public class DuplicateResourceException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    public DuplicateResourceException(String message) {
        super(message);
    }
    
    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s already exists with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}