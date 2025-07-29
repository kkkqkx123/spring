package com.example.demo.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.Collection;
import java.util.function.Supplier;

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
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // HR endpoints
                        .requestMatchers("/api/hr/**").hasAnyRole("ADMIN", "HR_MANAGER")
                        // Department endpoints
                        .requestMatchers("/api/departments/**").hasAnyRole("ADMIN", "HR_MANAGER", "USER", "DEPARTMENT_MANAGER")
                        // Employee endpoints - use method-level security
                        .requestMatchers("/api/employees/**").authenticated()
                        // Position endpoints
                        .requestMatchers("/api/positions/**").hasAnyRole("ADMIN", "HR_MANAGER")
                        // Payroll endpoints
                        .requestMatchers("/api/payroll/**").access(new AuthorizationManager<RequestAuthorizationContext>() {
                            @Override
                            public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext context) {
                                Authentication auth = authentication.get();
                                if (auth == null || !auth.isAuthenticated()) {
                                    return new AuthorizationDecision(false);
                                }
                                
                                // Check roles
                                Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
                                boolean hasRole = authorities.stream()
                                    .map(GrantedAuthority::getAuthority)
                                    .anyMatch(role -> 
                                        "ROLE_ADMIN".equals(role) || 
                                        "ROLE_PAYROLL_MANAGER".equals(role) || 
                                        "ROLE_HR_MANAGER".equals(role));
                                
                                // Check authorities
                                boolean hasAuthority = authorities.stream()
                                    .map(GrantedAuthority::getAuthority)
                                    .anyMatch(authority -> 
                                        "PAYROLL_READ".equals(authority) || 
                                        "PAYROLL_CREATE".equals(authority) || 
                                        "PAYROLL_UPDATE".equals(authority) || 
                                        "PAYROLL_DELETE".equals(authority));
                                
                                return new AuthorizationDecision(hasRole || hasAuthority);
                            }
                        })
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                );
        
        return http.build();
    }
}