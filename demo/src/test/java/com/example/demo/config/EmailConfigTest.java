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
        
        // Verify that the host, port, and username are not null, as they are injected from properties
        assertNotNull(mailSender.getHost(), "Mail host should not be null");
        assertTrue(mailSender.getPort() > 0, "Mail port should be a positive integer");
        assertNotNull(mailSender.getUsername(), "Mail username should not be null");

        // Verify mail properties
        assertEquals("true", mailSender.getJavaMailProperties().getProperty("mail.smtp.auth"),
                "SMTP auth should be enabled for test");
        assertEquals("false", mailSender.getJavaMailProperties().getProperty("mail.smtp.starttls.enable"),
                "STARTTLS should be disabled for dev");
        assertEquals("smtp", mailSender.getJavaMailProperties().getProperty("mail.transport.protocol"),
                "Transport protocol should be SMTP");
        assertEquals("true", mailSender.getJavaMailProperties().getProperty("mail.debug"),
                "Mail debug should be enabled");
    }
}