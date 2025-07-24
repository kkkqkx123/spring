package com.example.demo.exception;

/**
 * Exception thrown when there is an error sending an email.
 */
public class EmailSendingException extends RuntimeException {

    /**
     * Constructs a new EmailSendingException with the specified detail message.
     *
     * @param message the detail message
     */
    public EmailSendingException(String message) {
        super(message);
    }

    /**
     * Constructs a new EmailSendingException with the specified detail message and cause.
     *
     * @param message the detail message
     * @param cause   the cause
     */
    public EmailSendingException(String message, Throwable cause) {
        super(message, cause);
    }
}