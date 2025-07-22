package com.example.demo.controller;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.example.demo.service.PermissionService;

/**
 * Controller for permission management
 */
@RestController
@RequestMapping("/api/admin/permissions")
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    /**
     * Get all resources accessible by a user
     */
    @GetMapping("/users/{username}/resources")
    public ResponseEntity<List<Resource>> getUserResources(@PathVariable String username) {
        List<Resource> resources = permissionService.getUserResources(username);
        return ResponseEntity.ok(resources);
    }

    /**
     * Get all roles assigned to a user
     */
    @GetMapping("/users/{username}/roles")
    public ResponseEntity<List<String>> getUserRoles(@PathVariable String username) {
        Set<Role> roles = permissionService.getUserRoles(username);
        List<String> roleNames = roles.stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roleNames);
    }

    /**
     * Assign a role to a user
     */
    @PostMapping("/users/{username}/roles/{roleName}")
    public ResponseEntity<User> assignRoleToUser(@PathVariable String username, @PathVariable String roleName) {
        User user = permissionService.assignRoleToUser(username, roleName);
        return ResponseEntity.ok(user);
    }

    /**
     * Remove a role from a user
     */
    @DeleteMapping("/users/{username}/roles/{roleName}")
    public ResponseEntity<User> removeRoleFromUser(@PathVariable String username, @PathVariable String roleName) {
        User user = permissionService.removeRoleFromUser(username, roleName);
        return ResponseEntity.ok(user);
    }

    /**
     * Assign a resource to a role
     */
    @PostMapping("/roles/{roleName}/resources/{resourceId}")
    public ResponseEntity<Role> assignResourceToRole(@PathVariable String roleName, @PathVariable Long resourceId) {
        Role role = permissionService.assignResourceToRole(roleName, resourceId);
        return ResponseEntity.ok(role);
    }

    /**
     * Remove a resource from a role
     */
    @DeleteMapping("/roles/{roleName}/resources/{resourceId}")
    public ResponseEntity<Role> removeResourceFromRole(@PathVariable String roleName, @PathVariable Long resourceId) {
        Role role = permissionService.removeResourceFromRole(roleName, resourceId);
        return ResponseEntity.ok(role);
    }

    /**
     * Check if a user has a specific role
     */
    @GetMapping("/users/{username}/roles/{roleName}/check")
    public ResponseEntity<Boolean> hasRole(@PathVariable String username, @PathVariable String roleName) {
        boolean hasRole = permissionService.hasRole(username, roleName);
        return ResponseEntity.ok(hasRole);
    }

    /**
     * Check if a user has permission to access a resource
     */
    @GetMapping("/users/{username}/resources/check")
    public ResponseEntity<Boolean> hasPermission(@PathVariable String username, String resourceUrl, String method) {
        boolean hasPermission = permissionService.hasPermission(username, resourceUrl, method);
        return ResponseEntity.ok(hasPermission);
    }
}