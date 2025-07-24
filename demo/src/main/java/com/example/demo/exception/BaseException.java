package com.example.demo.exception;

/**
 * Base exception class for all application-specific exceptions
 * Includes error code support
 */
public abstract class BaseException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
    
    private final String errorCode;
    
    public BaseException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public BaseException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    /**
     * Get the error code associated with this exception
     * @return the error code
     */
    public String getErrorCode() {
        return errorCode;
    }
}