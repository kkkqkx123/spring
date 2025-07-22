package com.example.demo.model.entity;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for User entity
 */
class UserTest {
    
    private User user;
    private Role adminRole;
    private Role userRole;
    
    @BeforeEach
    void setUp() {
        // Create roles
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ROLE_ADMIN");
        
        userRole = new Role();
        userRole.setId(2L);
        userRole.setName("ROLE_USER");
        
        // Create user
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("password");
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEnabled(true);
        
        // Add roles to user
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);
    }
    
    @Test
    void testHasRole_WhenUserHasRole_ReturnsTrue() {
        assertTrue(user.hasRole("ROLE_USER"));
    }
    
    @Test
    void testHasRole_WhenUserDoesNotHaveRole_ReturnsFalse() {
        assertFalse(user.hasRole("ROLE_ADMIN"));
    }
    
    @Test
    void testGetFullName_WhenFirstAndLastNamePresent_ReturnsFullName() {
        assertEquals("Test User", user.getFullName());
    }
    
    @Test
    void testGetFullName_WhenOnlyFirstNamePresent_ReturnsFirstName() {
        user.setLastName(null);
        assertEquals("Test", user.getFullName());
    }
    
    @Test
    void testGetFullName_WhenOnlyLastNamePresent_ReturnsLastName() {
        user.setFirstName(null);
        assertEquals("User", user.getFullName());
    }
    
    @Test
    void testGetFullName_WhenNoNamePresent_ReturnsUsername() {
        user.setFirstName(null);
        user.setLastName(null);
        assertEquals("testuser", user.getFullName());
    }
}