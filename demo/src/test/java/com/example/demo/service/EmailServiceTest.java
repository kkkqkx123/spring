package com.example.demo.service;

import com.example.demo.exception.EmailSendingException;
import com.example.demo.service.impl.EmailServiceImpl;
import freemarker.template.Configuration;
import freemarker.template.Template;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private Configuration freemarkerConfiguration;

    @Mock
    private Template template;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailServiceImpl emailService;

    private final String recipient = "test@example.com";
    private final String subject = "Test Subject";
    private final String templateName = "email/test-template.ftl";
    private final Map<String, Object> variables = new HashMap<>();

    @BeforeEach
    void setUp() {
        variables.put("name", "Test User");
        variables.put("message", "Hello, this is a test email!");
    }

    @Test
    void sendTemplatedEmail_Success() throws Exception {
        // Arrange
        String processedTemplate = "<html><body>Hello, Test User!</body></html>";
        
        when(freemarkerConfiguration.getTemplate(templateName)).thenReturn(template);
        when(FreeMarkerTemplateUtils.processTemplateIntoString(template, variables)).thenReturn(processedTemplate);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        
        // Act
        emailService.sendTemplatedEmail(recipient, subject, templateName, variables);
        
        // Assert
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendTemplatedEmail_TemplateProcessingError() throws Exception {
        // Arrange
        when(freemarkerConfiguration.getTemplate(templateName)).thenThrow(new RuntimeException("Template not found"));
        
        // Act & Assert
        assertThrows(EmailSendingException.class, () -> 
            emailService.sendTemplatedEmail(recipient, subject, templateName, variables)
        );
        
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendBulkEmails_Success() throws Exception {
        // Arrange
        List<String> recipients = List.of("user1@example.com", "user2@example.com", "user3@example.com");
        String processedTemplate = "<html><body>Hello, Test User!</body></html>";
        
        when(freemarkerConfiguration.getTemplate(templateName)).thenReturn(template);
        when(FreeMarkerTemplateUtils.processTemplateIntoString(template, variables)).thenReturn(processedTemplate);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        
        // Act
        emailService.sendBulkEmails(recipients, subject, templateName, variables);
        
        // Assert - verify that send was called for each recipient
        verify(mailSender, times(recipients.size())).createMimeMessage();
    }

    @Test
    void sendSimpleEmail_Success() {
        // Arrange
        String content = "This is a test email content";
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        
        // Act
        emailService.sendSimpleEmail(recipient, subject, content);
        
        // Assert
        verify(mailSender).send(messageCaptor.capture());
        SimpleMailMessage sentMessage = messageCaptor.getValue();
        
        assertEquals(recipient, sentMessage.getTo()[0]);
        assertEquals(subject, sentMessage.getSubject());
        assertEquals(content, sentMessage.getText());
    }

    @Test
    void sendSimpleEmail_MailException() {
        // Arrange
        String content = "This is a test email content";
        doThrow(new RuntimeException("Mail server connection failed")).when(mailSender).send(any(SimpleMailMessage.class));
        
        // Act & Assert
        assertThrows(EmailSendingException.class, () -> 
            emailService.sendSimpleEmail(recipient, subject, content)
        );
    }
}