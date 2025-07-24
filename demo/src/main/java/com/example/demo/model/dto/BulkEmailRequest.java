package com.example.demo.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object for bulk email requests.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailRequest {

    /**
     * List of recipient email addresses.
     */
    @NotEmpty(message = "Recipients list cannot be empty")
    private List<String> recipients;

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