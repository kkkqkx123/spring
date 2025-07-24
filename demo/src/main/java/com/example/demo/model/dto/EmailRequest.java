package com.example.demo.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Data Transfer Object for email requests.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequest {

    /**
     * Recipient email address.
     */
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    private String to;

    /**
     * Email subject.
     */
    @NotBlank(message = "Subject is required")
    private String subject;

    /**
     * Template name (relative to the template root directory).
     */
    @NotBlank(message = "Template is required")
    private String template;

    /**
     * Variables to be used in the template.
     */
    @NotNull(message = "Variables map is required")
    private Map<String, Object> variables;
}