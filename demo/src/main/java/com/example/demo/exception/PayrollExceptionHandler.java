package com.example.demo.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import lombok.extern.slf4j.Slf4j;

/**
 * Exception handler for payroll-related exceptions
 */
@ControllerAdvice
@Slf4j
public class PayrollExceptionHandler {

    /**
     * Handle PayrollCalculationException
     * 
     * @param ex the exception
     * @return error response
     */
    @ExceptionHandler(PayrollCalculationException.class)
    public ResponseEntity<Map<String, Object>> handlePayrollCalculationException(PayrollCalculationException ex) {
        log.error("Payroll calculation error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Payroll Calculation Error");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
    
    /**
     * Handle IllegalStateException for payroll operations
     * 
     * @param ex the exception
     * @return error response
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalStateException(IllegalStateException ex) {
        log.error("Illegal state error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Operation Not Allowed");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("status", HttpStatus.CONFLICT.value());
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }
}