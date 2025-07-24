package com.example.demo.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EmailConfigTest {

    @Autowired
    private JavaMailSender javaMailSender;

    @Test
    void testJavaMailSenderConfiguration() {
        // Verify that JavaMailSender is properly configured
        assertNotNull(javaMailSender, "JavaMailSender should not be null");
        assertTrue(javaMailSender instanceof JavaMailSenderImpl, "JavaMailSender should be an instance of JavaMailSenderImpl");
        
        JavaMailSenderImpl mailSender = (JavaMailSenderImpl) javaMailSender;
        
        // Verify mail server settings
        assertEquals("smtp.example.com", mailSender.getHost(), "Mail host should match configuration");
        assertEquals(587, mailSender.getPort(), "Mail port should match configuration");
        assertEquals("noreply@example.com", mailSender.getUsername(), "Mail username should match configuration");
        
        // Verify mail properties
        assertTrue(Boolean.parseBoolean(mailSender.getJavaMailProperties().getProperty("mail.smtp.auth")), 
                "SMTP auth should be enabled");
        assertTrue(Boolean.parseBoolean(mailSender.getJavaMailProperties().getProperty("mail.smtp.starttls.enable")), 
                "STARTTLS should be enabled");
        assertEquals("smtp", mailSender.getJavaMailProperties().getProperty("mail.transport.protocol"), 
                "Transport protocol should be SMTP");
    }
}