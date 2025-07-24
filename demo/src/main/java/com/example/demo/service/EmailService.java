package com.example.demo.service;

import java.util.List;
import java.util.Map;

/**
 * Service interface for sending emails.
 */
public interface EmailService {
    
    /**
     * Sends an email using a Freemarker template.
     *
     * @param to        Recipient email address
     * @param subject   Email subject
     * @param template  Template name (relative to the template root directory)
     * @param variables Variables to be used in the template
     */
    void sendTemplatedEmail(String to, String subject, String template, Map<String, Object> variables);
    
    /**
     * Sends an email to multiple recipients using a Freemarker template.
     *
     * @param recipients List of recipient email addresses
     * @param subject    Email subject
     * @param template   Template name (relative to the template root directory)
     * @param variables  Variables to be used in the template
     */
    void sendBulkEmails(List<String> recipients, String subject, String template, Map<String, Object> variables);
    
    /**
     * Sends a simple text email.
     *
     * @param to      Recipient email address
     * @param subject Email subject
     * @param text    Email content
     */
    void sendSimpleEmail(String to, String subject, String text);
}