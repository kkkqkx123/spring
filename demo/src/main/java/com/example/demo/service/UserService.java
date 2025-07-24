package com.example.demo.service;

import org.springframework.security.core.Authentication;

import com.example.demo.model.entity.User;

/**
 * Service for user operations
 */
public interface UserService {
    
    /**
     * Get a user from authentication
     * 
     * @param authentication the authentication object
     * @return the user
     */
    User getUserFromAuthentication(Authentication authentication);
    
    /**
     * Get a user by ID
     * 
     * @param id the user ID
     * @return the user, or null if not found
     */
    User getUserById(Long id);
}