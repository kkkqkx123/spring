package com.example.demo.exception;

/**
 * Exception thrown when input data is invalid
 */
public class InvalidDataException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    public InvalidDataException(String message) {
        super(message);
    }
}