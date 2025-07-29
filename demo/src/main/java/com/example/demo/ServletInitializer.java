package com.example.demo;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

/**
 * Servlet initializer for WAR deployment to external servlet containers
 * This class is used when deploying the application as a WAR file to 
 * external servlet containers like Tomcat, Jetty, or Undertow.
 */
@Slf4j
@Configuration
public class ServletInitializer extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        log.info("Configuring Employee Management System for WAR deployment");
        
        return application
                .sources(DemoApplication.class)
                .properties(
                    "spring.config.name=application",
                    "spring.config.location=classpath:/,classpath:/config/,file:./,file:./config/"
                );
    }

    @Override
    protected SpringApplicationBuilder createSpringApplicationBuilder() {
        SpringApplicationBuilder builder = super.createSpringApplicationBuilder();
        
        // Set default profile if none is specified
        String activeProfile = System.getProperty("spring.profiles.active");
        if (activeProfile == null || activeProfile.isEmpty()) {
            log.info("No active profile specified, defaulting to 'prod' for WAR deployment");
            builder.properties("spring.profiles.active=prod");
        } else {
            log.info("Using active profile: {}", activeProfile);
        }
        
        return builder;
    }
}