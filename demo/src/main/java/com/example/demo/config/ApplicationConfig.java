package com.example.demo.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application configuration class
 */
@Configuration
@EnableAsync
@EnableScheduling
@EnableConfigurationProperties({AppProperties.class})
public class ApplicationConfig {
    // Configuration beans will be defined here if needed
}