package com.example.demo.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for EmailControllerTest
 */
@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class EmailControllerTestSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/emails/send").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/emails/send-bulk").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/emails/welcome/**").hasAnyRole("ADMIN", "HR_MANAGER")
                .requestMatchers("/emails/payroll-notification/**").hasAnyRole("ADMIN", "HR_MANAGER", "FINANCE_MANAGER")
                .requestMatchers("/emails/announcement").hasAnyRole("ADMIN", "HR_MANAGER")
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}