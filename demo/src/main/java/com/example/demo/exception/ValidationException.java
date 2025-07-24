package com.example.demo.exception;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when validation fails
 */
public class ValidationException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    private static final String ERROR_CODE = "VAL-400";
    
    private final Map<String, String> errors;
    
    public ValidationException(String message) {
        super(message, ERROR_CODE);
        this.errors = new HashMap<>();
    }
    
    public ValidationException(String message, Map<String, String> errors) {
        super(message, ERROR_CODE);
        this.errors = errors;
    }
    
    /**
     * Add a validation error
     * @param field the field that failed validation
     * @param message the error message
     */
    public void addError(String field, String message) {
        errors.put(field, message);
    }
    
    /**
     * Get all validation errors
     * @return map of field names to error messages
     */
    public Map<String, String> getErrors() {
        return errors;
    }
    
    /**
     * Check if there are any validation errors
     * @return true if there are errors, false otherwise
     */
    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}