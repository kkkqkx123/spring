package com.example.demo.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for tests
 */
@TestConfiguration
@EnableWebSecurity
public class TestSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authorize -> authorize
                                .requestMatchers("/api/notifications/user", "/api/notifications/users").hasAnyRole("ADMIN", "MANAGER")
                                .requestMatchers("/api/notifications/role").hasRole("ADMIN")
                                .requestMatchers("/api/chat/**").hasAnyRole("USER", "ADMIN", "MANAGER")
                                .requestMatchers("/api/payroll/**").hasAnyRole("ADMIN", "MANAGER")
                                .anyRequest().authenticated()
                );
        
        return http.build();
    }
}