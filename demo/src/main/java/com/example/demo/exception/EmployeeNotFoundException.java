package com.example.demo.exception;

/**
 * Exception thrown when an employee is not found
 */
public class EmployeeNotFoundException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    private static final String ERROR_CODE = "EMP-404";
    
    public EmployeeNotFoundException(String message) {
        super(message, ERROR_CODE);
    }
    
    public EmployeeNotFoundException(Long employeeId) {
        super(String.format("Employee not found with id: %d", employeeId), ERROR_CODE);
    }
    
    public EmployeeNotFoundException(String fieldName, Object fieldValue) {
        super(String.format("Employee not found with %s: '%s'", fieldName, fieldValue), ERROR_CODE);
    }
}