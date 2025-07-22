package com.example.demo.exception;

/**
 * Exception for department hierarchy-related errors
 */
public class DepartmentHierarchyException extends DepartmentException {
    
    private static final long serialVersionUID = 1L;

    public DepartmentHierarchyException(String message) {
        super(message);
    }

    public DepartmentHierarchyException(String message, Throwable cause) {
        super(message, cause);
    }
}