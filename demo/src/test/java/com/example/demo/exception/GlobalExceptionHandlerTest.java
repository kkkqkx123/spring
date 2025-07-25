package com.example.demo.exception;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.context.request.WebRequest;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        webRequest = mock(WebRequest.class);
    }

    @Test
    void shouldHandleEmployeeNotFoundException() {
        // Given
        EmployeeNotFoundException ex = new EmployeeNotFoundException(123L);

        // When
        ResponseEntity<Object> response = exceptionHandler.handleBaseException(ex, webRequest);

        // Then
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("Employee not found with id: 123", body.get("message"));
        assertEquals("EMP-404", body.get("errorCode"));
        assertEquals(HttpStatus.NOT_FOUND.value(), body.get("status"));
    }

    @Test
    void shouldHandleValidationException() {
        // Given
        Map<String, String> errors = new HashMap<>();
        errors.put("name", "Name is required");
        errors.put("email", "Email is invalid");
        ValidationException ex = new ValidationException("Validation failed", errors);

        // When
        ResponseEntity<Object> response = exceptionHandler.handleBaseException(ex, webRequest);

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("Validation failed", body.get("message"));
        assertEquals("VAL-400", body.get("errorCode"));
        assertEquals(HttpStatus.BAD_REQUEST.value(), body.get("status"));

        @SuppressWarnings("unchecked")
        Map<String, String> responseErrors = (Map<String, String>) body.get("errors");
        assertNotNull(responseErrors, "Validation errors should not be null");
        assertEquals(2, responseErrors.size());
        assertEquals("Name is required", responseErrors.get("name"));
        assertEquals("Email is invalid", responseErrors.get("email"));
    }

    @Test
    void shouldHandleUnauthorizedAccessException() {
        // Given
        UnauthorizedAccessException ex = new UnauthorizedAccessException("Employee", "DELETE");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleBaseException(ex, webRequest);

        // Then
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("Unauthorized access: Cannot perform 'DELETE' operation on 'Employee'", body.get("message"));
        assertEquals("AUTH-403", body.get("errorCode"));
        assertEquals(HttpStatus.FORBIDDEN.value(), body.get("status"));
    }

    @Test
    void shouldHandleDataIntegrityViolationException() {
        // Given
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "Cannot delete entity with dependencies");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleDataIntegrityViolation(ex, webRequest);

        // Then
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("Data integrity violation: Operation would violate data constraints", body.get("message"));
        assertEquals("DATA-409", body.get("errorCode"));
        assertEquals(HttpStatus.CONFLICT.value(), body.get("status"));
    }

    @Test
    void shouldHandleEmailSendingException() {
        // Given
        EmailSendingException ex = new EmailSendingException("Failed to send email");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleEmailSendingException(ex, webRequest);

        // Then
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("Email sending failed: Failed to send email", body.get("message"));
        assertEquals("EMAIL-500", body.get("errorCode"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), body.get("status"));
    }

    @Test
    void shouldHandleAccessDeniedException() {
        // Given
        AccessDeniedException ex = new AccessDeniedException("Access denied to resource");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAccessDeniedException(ex, webRequest);

        // Then
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("Access Denied: Access denied to resource", body.get("message"));
        assertEquals("AUTH-403", body.get("errorCode"));
        assertEquals(HttpStatus.FORBIDDEN.value(), body.get("status"));
    }

    @Test
    void shouldHandleGenericException() {
        // Given
        Exception ex = new RuntimeException("Something went wrong");

        // When
        ResponseEntity<Object> response = exceptionHandler.handleAllExceptions(ex, webRequest);

        // Then
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertEquals("An unexpected error occurred: Something went wrong", body.get("message"));
        assertEquals("SYS-500", body.get("errorCode"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), body.get("status"));
    }
}