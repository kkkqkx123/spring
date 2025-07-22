package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.impl.PermissionServiceImpl;

import jakarta.persistence.EntityNotFoundException;

/**
 * Unit tests for PermissionService
 */
@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private PermissionServiceImpl permissionService;

    private User user;
    private Role adminRole;
    private Role userRole;
    private Resource getUsersResource;
    private Resource createUserResource;

    @BeforeEach
    void setUp() {
        // Create resources
        getUsersResource = new Resource();
        getUsersResource.setId(1L);
        getUsersResource.setName("Get Users");
        getUsersResource.setUrl("/api/users");
        getUsersResource.setMethod("GET");

        createUserResource = new Resource();
        createUserResource.setId(2L);
        createUserResource.setName("Create User");
        createUserResource.setUrl("/api/users");
        createUserResource.setMethod("POST");

        // Create roles
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ROLE_ADMIN");
        Set<Resource> adminResources = new HashSet<>();
        adminResources.add(getUsersResource);
        adminResources.add(createUserResource);
        adminRole.setResources(adminResources);

        userRole = new Role();
        userRole.setId(2L);
        userRole.setName("ROLE_USER");
        Set<Resource> userResources = new HashSet<>();
        userResources.add(getUsersResource);
        userRole.setResources(userResources);

        // Create user
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);
    }

    @Test
    void testHasPermission_WhenUserHasPermission_ReturnsTrue() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        boolean result = permissionService.hasPermission("testuser", "/api/users", "GET");

        assertTrue(result);
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void testHasPermission_WhenUserDoesNotHavePermission_ReturnsFalse() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        boolean result = permissionService.hasPermission("testuser", "/api/users", "POST");

        assertFalse(result);
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void testHasPermission_WhenUserNotFound_ThrowsException() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> {
            permissionService.hasPermission("nonexistent", "/api/users", "GET");
        });
        
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    void testHasRole_WhenUserHasRole_ReturnsTrue() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        boolean result = permissionService.hasRole("testuser", "ROLE_USER");

        assertTrue(result);
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void testHasRole_WhenUserDoesNotHaveRole_ReturnsFalse() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        boolean result = permissionService.hasRole("testuser", "ROLE_ADMIN");

        assertFalse(result);
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void testGetUserResources_ReturnsAllAccessibleResources() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        List<Resource> resources = permissionService.getUserResources("testuser");

        assertEquals(1, resources.size());
        assertTrue(resources.contains(getUsersResource));
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void testAssignRoleToUser_AddsRoleToUser() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User result = permissionService.assignRoleToUser("testuser", "ROLE_ADMIN");

        assertEquals(user, result);
        assertTrue(user.getRoles().contains(adminRole));
        verify(userRepository).findByUsername("testuser");
        verify(roleRepository).findByName("ROLE_ADMIN");
        verify(userRepository).save(user);
    }

    @Test
    void testRemoveRoleFromUser_RemovesRoleFromUser() {
        // Add admin role to user first
        user.getRoles().add(adminRole);
        
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User result = permissionService.removeRoleFromUser("testuser", "ROLE_ADMIN");

        assertEquals(user, result);
        assertFalse(user.getRoles().contains(adminRole));
        verify(userRepository).findByUsername("testuser");
        verify(roleRepository).findByName("ROLE_ADMIN");
        verify(userRepository).save(user);
    }
}