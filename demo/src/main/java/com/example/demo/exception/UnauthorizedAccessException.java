package com.example.demo.exception;

/**
 * Exception thrown when a user attempts to access a resource without proper authorization
 */
public class UnauthorizedAccessException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    private static final String ERROR_CODE = "AUTH-403";
    
    public UnauthorizedAccessException(String message) {
        super(message, ERROR_CODE);
    }
    
    public UnauthorizedAccessException(String resource, String operation) {
        super(String.format("Unauthorized access: Cannot perform '%s' operation on '%s'", operation, resource), ERROR_CODE);
    }
}