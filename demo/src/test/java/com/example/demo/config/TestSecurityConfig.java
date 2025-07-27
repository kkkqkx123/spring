package com.example.demo.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

/**
 * Security configuration for tests
 */
@TestConfiguration
@EnableWebSecurity
public class TestSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                        // HR endpoints
                        .requestMatchers("/api/hr/**").hasAnyAuthority("ADMIN", "HR_MANAGER")
                        // Department endpoints
                        .requestMatchers("/api/departments/**").hasAnyAuthority("ADMIN", "HR_MANAGER", "USER", "DEPARTMENT_MANAGER")
                        // Employee endpoints - use method-level security
                        .requestMatchers("/api/employees/**").authenticated()
                        // Position endpoints
                        .requestMatchers("/api/positions/**").hasAnyAuthority("ADMIN", "HR_MANAGER")
                        // Payroll endpoints
                        .requestMatchers("/api/payroll/**").hasAnyAuthority("ADMIN", "PAYROLL_MANAGER", "HR_MANAGER", "PAYROLL_READ", "PAYROLL_CREATE", "PAYROLL_UPDATE", "PAYROLL_DELETE")
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                );
        
        return http.build();
    }
}