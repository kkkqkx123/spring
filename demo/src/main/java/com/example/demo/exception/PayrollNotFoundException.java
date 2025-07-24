package com.example.demo.exception;

/**
 * Exception thrown when a payroll record is not found
 */
public class PayrollNotFoundException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    private static final String ERROR_CODE = "PAY-404";
    
    public PayrollNotFoundException(String message) {
        super(message, ERROR_CODE);
    }
    
    public PayrollNotFoundException(Long payrollId) {
        super(String.format("Payroll record not found with id: %d", payrollId), ERROR_CODE);
    }
    
    public PayrollNotFoundException(String fieldName, Object fieldValue) {
        super(String.format("Payroll record not found with %s: '%s'", fieldName, fieldValue), ERROR_CODE);
    }
}