package com.example.demo.service;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.core.Authentication;

import com.example.demo.model.entity.User;

/**
 * Mock UserService for testing
 */
@TestComponent
public class MockUserService implements UserService {
    
    @Override
    public User getUserFromAuthentication(Authentication authentication) {
        // This method will be mocked in tests
        return null;
    }
    
    @Override
    public User getUserById(Long id) {
        // This method will be mocked in tests
        return null;
    }
}