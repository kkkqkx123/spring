package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ui.freemarker.FreeMarkerConfigurationFactoryBean;

/**
 * Freemarker configuration for email templates.
 * Sets up the Freemarker configuration bean and configures template loading.
 */
@Configuration
public class FreemarkerConfig {

    /**
     * Creates and configures the Freemarker configuration bean.
     * Sets the template loader path to classpath:/ftl/
     *
     * @return Configured FreeMarkerConfigurationFactoryBean
     */
    @Bean
    public FreeMarkerConfigurationFactoryBean freemarkerConfiguration() {
        FreeMarkerConfigurationFactoryBean bean = new FreeMarkerConfigurationFactoryBean();
        bean.setTemplateLoaderPath("classpath:/ftl/");
        bean.setDefaultEncoding("UTF-8");
        return bean;
    }
}