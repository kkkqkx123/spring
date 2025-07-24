package com.example.demo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for email responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailResponse {

    /**
     * Response message.
     */
    private String message;
}