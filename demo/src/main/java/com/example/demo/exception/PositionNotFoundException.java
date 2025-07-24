package com.example.demo.exception;

/**
 * Exception thrown when a position is not found
 */
public class PositionNotFoundException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    private static final String ERROR_CODE = "POS-404";
    
    public PositionNotFoundException(String message) {
        super(message, ERROR_CODE);
    }
    
    public PositionNotFoundException(Long positionId) {
        super(String.format("Position not found with id: %d", positionId), ERROR_CODE);
    }
    
    public PositionNotFoundException(String fieldName, Object fieldValue) {
        super(String.format("Position not found with %s: '%s'", fieldName, fieldValue), ERROR_CODE);
    }
}