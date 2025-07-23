package com.example.demo.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.PermissionService;

import jakarta.persistence.EntityNotFoundException;

/**
 * Implementation of PermissionService
 */
@Service
public class PermissionServiceImpl implements PermissionService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    /**
     * Check if a user has permission to access a resource
     */
    @Override
    @Cacheable(value = "userPermissions", key = "#username + '-' + #resourceUrl + '-' + #method")
    public boolean hasPermission(String username, String resourceUrl, String method) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        // Check if any of the user's roles has permission to access the resource
        return user.getRoles().stream()
                .anyMatch(role -> role.getResources().stream()
                        .anyMatch(resource -> resource.matches(resourceUrl, method)));
    }

    /**
     * Check if a user has a specific role
     */
    @Override
    @Cacheable(value = "userRoles", key = "#username + '-' + #roleName")
    public boolean hasRole(String username, String roleName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals(roleName));
    }

    /**
     * Get all resources accessible by a user
     */
    @Override
    @Cacheable(value = "userResources", key = "#username")
    public List<Resource> getUserResources(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        // Collect all resources from all roles
        return user.getRoles().stream()
                .flatMap(role -> role.getResources().stream())
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Get all roles assigned to a user
     */
    @Override
    @Cacheable(value = "userRoles", key = "#username")
    public Set<Role> getUserRoles(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        return new HashSet<>(user.getRoles());
    }

    /**
     * Assign a role to a user
     */
    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userRoles", "userResources"}, allEntries = true)
    public User assignRoleToUser(String username, String roleName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        user.getRoles().add(role);
        return userRepository.save(user);
    }

    /**
     * Remove a role from a user
     */
    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userRoles", "userResources"}, allEntries = true)
    public User removeRoleFromUser(String username, String roleName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        user.getRoles().remove(role);
        return userRepository.save(user);
    }

    /**
     * Assign a resource to a role
     */
    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userResources"}, allEntries = true)
    public Role assignResourceToRole(String roleName, Long resourceId) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found: " + resourceId));

        role.getResources().add(resource);
        return roleRepository.save(role);
    }

    /**
     * Remove a resource from a role
     */
    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userResources"}, allEntries = true)
    public Role removeResourceFromRole(String roleName, Long resourceId) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found: " + resourceId));

        role.getResources().remove(resource);
        return roleRepository.save(role);
    }
}