package com.example.demo.exception;

/**
 * Exception thrown when there's an issue with notifications
 */
public class NotificationException extends BaseException {
    
    private static final long serialVersionUID = 1L;
    private static final String ERROR_CODE = "NOTIF-500";
    
    public NotificationException(String message) {
        super(message, ERROR_CODE);
    }
    
    public NotificationException(String message, Throwable cause) {
        super(message, ERROR_CODE, cause);
    }
}