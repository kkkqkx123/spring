package com.example.demo.model.entity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for Resource entity
 */
class ResourceTest {
    
    private Resource exactResource;
    private Resource wildcardUrlResource;
    private Resource wildcardMethodResource;
    
    @BeforeEach
    void setUp() {
        // Create resources
        exactResource = new Resource();
        exactResource.setId(1L);
        exactResource.setName("Get User");
        exactResource.setUrl("/api/users/1");
        exactResource.setMethod("GET");
        
        wildcardUrlResource = new Resource();
        wildcardUrlResource.setId(2L);
        wildcardUrlResource.setName("All Users");
        wildcardUrlResource.setUrl("/api/users/**");
        wildcardUrlResource.setMethod("GET");
        
        wildcardMethodResource = new Resource();
        wildcardMethodResource.setId(3L);
        wildcardMethodResource.setName("All Methods for Users");
        wildcardMethodResource.setUrl("/api/users");
        wildcardMethodResource.setMethod("*");
    }
    
    @Test
    void testMatches_WhenExactUrlAndMethodMatch_ReturnsTrue() {
        assertTrue(exactResource.matches("/api/users/1", "GET"));
    }
    
    @Test
    void testMatches_WhenExactUrlButDifferentMethod_ReturnsFalse() {
        assertFalse(exactResource.matches("/api/users/1", "POST"));
    }
    
    @Test
    void testMatches_WhenDifferentUrlButSameMethod_ReturnsFalse() {
        assertFalse(exactResource.matches("/api/users/2", "GET"));
    }
    
    @Test
    void testMatches_WhenUrlMatchesWildcard_ReturnsTrue() {
        assertTrue(wildcardUrlResource.matches("/api/users/1", "GET"));
        assertTrue(wildcardUrlResource.matches("/api/users/2", "GET"));
        assertTrue(wildcardUrlResource.matches("/api/users/search", "GET"));
    }
    
    @Test
    void testMatches_WhenUrlDoesNotMatchWildcard_ReturnsFalse() {
        assertFalse(wildcardUrlResource.matches("/api/departments", "GET"));
    }
    
    @Test
    void testMatches_WhenMethodMatchesWildcard_ReturnsTrue() {
        assertTrue(wildcardMethodResource.matches("/api/users", "GET"));
        assertTrue(wildcardMethodResource.matches("/api/users", "POST"));
        assertTrue(wildcardMethodResource.matches("/api/users", "PUT"));
        assertTrue(wildcardMethodResource.matches("/api/users", "DELETE"));
    }
}