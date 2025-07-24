package com.example.demo.service.impl;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.demo.model.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;

import lombok.RequiredArgsConstructor;

/**
 * Implementation of UserService
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    @Override
    public User getUserFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username).orElse(null);
    }
    
    @Override
    public User getUserById(Long id) {
        if (id == null) {
            return null;
        }
        
        return userRepository.findById(id).orElse(null);
    }
}