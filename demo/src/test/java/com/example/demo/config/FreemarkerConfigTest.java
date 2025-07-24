package com.example.demo.config;

import freemarker.template.Configuration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class FreemarkerConfigTest {

    @Autowired
    private Configuration freemarkerConfiguration;

    @Test
    void testFreemarkerConfiguration() {
        // Verify that Freemarker Configuration is properly set up
        assertNotNull(freemarkerConfiguration, "Freemarker Configuration should not be null");
        
        // Verify encoding
        assertEquals("UTF-8", freemarkerConfiguration.getDefaultEncoding(), 
                "Default encoding should be UTF-8");
        
        // Verify template loading works
        try {
            // This will throw an exception if the template loader path is not correctly configured
            assertNotNull(freemarkerConfiguration.getTemplateLoader(), "Template loader should not be null");
        } catch (Exception e) {
            fail("Template loader should be properly configured: " + e.getMessage());
        }
    }
}