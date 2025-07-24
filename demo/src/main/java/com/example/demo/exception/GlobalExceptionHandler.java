package com.example.demo.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for the application
 * Handles all custom exceptions and common Spring exceptions
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Create a standard error response
     */
    private ResponseEntity<Object> createErrorResponse(HttpStatus status, String message, String errorCode) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        
        if (errorCode != null) {
            body.put("errorCode", errorCode);
        }
        
        return new ResponseEntity<>(body, status);
    }
    
    /**
     * Handle BaseException and its subclasses
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<Object> handleBaseException(BaseException ex, WebRequest request) {
        HttpStatus status;
        
        // Determine appropriate HTTP status based on exception type
        if (ex instanceof EmployeeNotFoundException || 
            ex instanceof PositionNotFoundException || 
            ex instanceof PayrollNotFoundException) {
            status = HttpStatus.NOT_FOUND;
        } else if (ex instanceof ValidationException) {
            status = HttpStatus.BAD_REQUEST;
        } else if (ex instanceof UnauthorizedAccessException) {
            status = HttpStatus.FORBIDDEN;
        } else if (ex instanceof NotificationException) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", ex.getMessage());
        body.put("errorCode", ex.getErrorCode());
        
        // Add validation errors if present
        if (ex instanceof ValidationException) {
            ValidationException validationEx = (ValidationException) ex;
            if (validationEx.hasErrors()) {
                body.put("errors", validationEx.getErrors());
            }
        }
        
        return new ResponseEntity<>(body, status);
    }

    /**
     * Handle EntityNotFoundException
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Object> handleEntityNotFoundException(EntityNotFoundException ex, WebRequest request) {
        return createErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }
    
    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        return createErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }
    
    /**
     * Handle IllegalStateException
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Object> handleIllegalStateException(IllegalStateException ex, WebRequest request) {
        return createErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), null);
    }
    
    /**
     * Handle validation exceptions
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.put("message", "Validation failed");
        body.put("errorCode", "VAL-400");
        
        // Extract validation errors
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                error -> error.getField(),
                error -> error.getDefaultMessage(),
                (existingMessage, newMessage) -> existingMessage + "; " + newMessage
            ));
        
        body.put("errors", errors);
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Handle data integrity violations
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex, WebRequest request) {
        String message = "Data integrity violation: Operation would violate data constraints";
        return createErrorResponse(HttpStatus.CONFLICT, message, "DATA-409");
    }
    
    /**
     * Handle email sending exceptions
     */
    @ExceptionHandler(EmailSendingException.class)
    public ResponseEntity<Object> handleEmailSendingException(EmailSendingException ex, WebRequest request) {
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Email sending failed: " + ex.getMessage(), "EMAIL-500");
    }
    
    /**
     * Handle authorization exceptions
     */
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<Object> handleAuthorizationDeniedException(AuthorizationDeniedException ex, WebRequest request) {
        return createErrorResponse(HttpStatus.FORBIDDEN, "Access Denied: " + ex.getMessage(), "AUTH-403");
    }
    
    /**
     * Handle Spring Security access denied exceptions
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex, WebRequest request) {
        return createErrorResponse(HttpStatus.FORBIDDEN, "Access Denied: " + ex.getMessage(), "AUTH-403");
    }
    
    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        return createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR, 
            "An unexpected error occurred: " + ex.getMessage(),
            "SYS-500"
        );
    }
}