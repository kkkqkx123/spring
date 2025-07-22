package com.example.demo.model.entity;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for Role entity
 */
class RoleTest {
    
    private Role role;
    private Resource getResource;
    private Resource postResource;
    
    @BeforeEach
    void setUp() {
        // Create resources
        getResource = new Resource();
        getResource.setId(1L);
        getResource.setName("Get Users");
        getResource.setUrl("/api/users");
        getResource.setMethod("GET");
        
        postResource = new Resource();
        postResource.setId(2L);
        postResource.setName("Create User");
        postResource.setUrl("/api/users");
        postResource.setMethod("POST");
        
        // Create role
        role = new Role();
        role.setId(1L);
        role.setName("ROLE_ADMIN");
        role.setDescription("Administrator role");
        
        // Add resources to role
        Set<Resource> resources = new HashSet<>();
        resources.add(getResource);
        role.setResources(resources);
    }
    
    @Test
    void testHasResourcePermission_WhenRoleHasResourceAndMethod_ReturnsTrue() {
        assertTrue(role.hasResourcePermission("/api/users", "GET"));
    }
    
    @Test
    void testHasResourcePermission_WhenRoleHasResourceButDifferentMethod_ReturnsFalse() {
        assertFalse(role.hasResourcePermission("/api/users", "POST"));
    }
    
    @Test
    void testHasResourcePermission_WhenRoleDoesNotHaveResource_ReturnsFalse() {
        assertFalse(role.hasResourcePermission("/api/departments", "GET"));
    }
    
    @Test
    void testAddResource_AddsResourceToRole() {
        // Add POST resource
        role.addResource(postResource);
        
        // Verify
        assertTrue(role.getResources().contains(postResource));
        assertEquals(2, role.getResources().size());
    }
    
    @Test
    void testRemoveResource_RemovesResourceFromRole() {
        // Remove GET resource
        role.removeResource(getResource);
        
        // Verify
        assertFalse(role.getResources().contains(getResource));
        assertEquals(0, role.getResources().size());
    }
}