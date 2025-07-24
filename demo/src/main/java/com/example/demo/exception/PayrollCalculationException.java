package com.example.demo.exception;

/**
 * Exception thrown when payroll calculations are invalid
 */
public class PayrollCalculationException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public PayrollCalculationException(String message) {
        super(message);
    }

    public PayrollCalculationException(String message, Throwable cause) {
        super(message, cause);
    }
}