package com.example.demo.service.impl;

import com.example.demo.exception.EmailSendingException;
import com.example.demo.service.EmailService;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Implementation of the EmailService interface.
 * Provides functionality for sending emails using templates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final Configuration freemarkerConfiguration;

    /**
     * Sends an email using a Freemarker template asynchronously.
     *
     * @param to        Recipient email address
     * @param subject   Email subject
     * @param template  Template name (relative to the template root directory)
     * @param variables Variables to be used in the template
     */
    @Override
    @Async
    public void sendTemplatedEmail(String to, String subject, String template, Map<String, Object> variables) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            
            // Process the template
            Template emailTemplate = freemarkerConfiguration.getTemplate(template);
            String htmlContent = FreeMarkerTemplateUtils.processTemplateIntoString(emailTemplate, variables);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (IOException | TemplateException e) {
            log.error("Error processing email template: {}", e.getMessage(), e);
            throw new EmailSendingException("Error processing email template", e);
        } catch (MessagingException e) {
            log.error("Error creating email message: {}", e.getMessage(), e);
            throw new EmailSendingException("Error creating email message", e);
        } catch (MailException e) {
            log.error("Error sending email: {}", e.getMessage(), e);
            throw new EmailSendingException("Error sending email", e);
        }
    }

    /**
     * Sends an email to multiple recipients using a Freemarker template asynchronously.
     * Uses CompletableFuture to manage multiple threads for bulk sending.
     *
     * @param recipients List of recipient email addresses
     * @param subject    Email subject
     * @param template   Template name (relative to the template root directory)
     * @param variables  Variables to be used in the template
     */
    @Override
    @Async
    public void sendBulkEmails(List<String> recipients, String subject, String template, Map<String, Object> variables) {
        log.info("Starting bulk email sending to {} recipients", recipients.size());
        
        // Process the template once to avoid processing it for each recipient
        String htmlContent;
        try {
            Template emailTemplate = freemarkerConfiguration.getTemplate(template);
            htmlContent = FreeMarkerTemplateUtils.processTemplateIntoString(emailTemplate, variables);
        } catch (IOException | TemplateException e) {
            log.error("Error processing email template: {}", e.getMessage(), e);
            throw new EmailSendingException("Error processing email template", e);
        }
        
        // Create a CompletableFuture for each recipient
        List<CompletableFuture<Void>> futures = recipients.stream()
                .map(recipient -> CompletableFuture.runAsync(() -> {
                    try {
                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                        
                        helper.setTo(recipient);
                        helper.setSubject(subject);
                        helper.setText(htmlContent, true);
                        
                        mailSender.send(message);
                        log.debug("Email sent successfully to: {}", recipient);
                    } catch (MessagingException e) {
                        log.error("Error creating email message for {}: {}", recipient, e.getMessage(), e);
                    } catch (MailException e) {
                        log.error("Error sending email to {}: {}", recipient, e.getMessage(), e);
                    }
                }))
                .toList();
        
        // Wait for all emails to be sent
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        log.info("Bulk email sending completed");
    }

    /**
     * Sends a simple text email asynchronously.
     *
     * @param to      Recipient email address
     * @param subject Email subject
     * @param text    Email content
     */
    @Override
    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            log.info("Simple email sent successfully to: {}", to);
        } catch (MailException e) {
            log.error("Error sending simple email: {}", e.getMessage(), e);
            throw new EmailSendingException("Error sending simple email", e);
        }
    }
}