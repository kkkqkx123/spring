package com.example.demo.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.auditing.DateTimeProvider;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Test JPA configuration for entity auditing in tests
 */
@TestConfiguration
@EnableJpaAuditing(auditorAwareRef = "testAuditorProvider", dateTimeProviderRef = "testDateTimeProvider")
public class TestJpaConfig {

    /**
     * Provides a fixed auditor for testing
     */
    @Bean
    public AuditorAware<String> testAuditorProvider() {
        return () -> Optional.of("test-user");
    }
    
    /**
     * Provides a fixed date/time for testing
     */
    @Bean
    public DateTimeProvider testDateTimeProvider() {
        return () -> Optional.of(LocalDateTime.of(2025, 7, 23, 10, 0));
    }
}