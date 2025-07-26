package com.example.demo.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.PermissionService;

/**
 * Custom UserDetailsService implementation for loading user-specific data
 * Includes caching for better performance and loads user permissions
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);
    
    private final UserRepository userRepository;
    
    private final PermissionService permissionService;

    public UserDetailsServiceImpl(UserRepository userRepository, PermissionService permissionService) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
    }

    /**
     * Load user by username with caching
     * This method is called by Spring Security during authentication
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "userDetails", key = "#username")
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.debug("Loading user details for username: {}", username);
        
        // Find user in the database
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.warn("User not found with username: {}", username);
                    return new UsernameNotFoundException("User not found with username: " + username);
                });
        
        logger.debug("Found user {} with {} roles", username, user.getRoles().size());
        
        try {
            // Load user permissions from permission service
            permissionService.loadUserPermissions(user);
        } catch (Exception e) {
            logger.error("Error loading user permissions for username: {}", username, e);
            throw new RuntimeException("Error loading user permissions", e);
        }
        
        // Build UserDetails with user data and permissions
        return UserDetailsImpl.build(user);
    }
}