package com.example.demo.exception;

import java.util.List;
import java.util.Map;

import lombok.Getter;

/**
 * Exception thrown when validation errors occur during Excel import
 */
@Getter
public class ImportValidationException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Map of validation errors (row index -> list of error messages)
     */
    private final Map<Integer, List<String>> validationErrors;
    
    /**
     * Constructor with validation errors map
     * 
     * @param message the error message
     * @param validationErrors map of validation errors
     */
    public ImportValidationException(String message, Map<Integer, List<String>> validationErrors) {
        super(message);
        this.validationErrors = validationErrors;
    }
}