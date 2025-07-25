package com.example.demo.service;

import java.util.List;
import java.util.Set;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;

/**
 * Service interface for permission management
 */
public interface PermissionService {
    
    /**
     * Check if a user has permission to access a resource
     * 
     * @param username the username
     * @param resourceUrl the resource URL
     * @param method the HTTP method
     * @return true if the user has permission, false otherwise
     */
    boolean hasPermission(String username, String resourceUrl, String method);
    
    /**
     * Check if a user has a specific role
     * 
     * @param username the username
     * @param roleName the role name
     * @return true if the user has the role, false otherwise
     */
    boolean hasRole(String username, String roleName);
    
    /**
     * Get all resources accessible by a user
     * 
     * @param username the username
     * @return a list of resources
     */
    List<Resource> getUserResources(String username);
    
    /**
     * Get all roles assigned to a user
     * 
     * @param username the username
     * @return a set of roles
     */
    Set<Role> getUserRoles(String username);
    
    /**
     * Assign a role to a user
     * 
     * @param username the username
     * @param roleName the role name
     * @return the updated user
     */
    User assignRoleToUser(String username, String roleName);
    
    /**
     * Remove a role from a user
     * 
     * @param username the username
     * @param roleName the role name
     * @return the updated user
     */
    User removeRoleFromUser(String username, String roleName);
    
    /**
     * Assign a resource to a role
     * 
     * @param roleName the role name
     * @param resourceId the resource ID
     * @return the updated role
     */
    Role assignResourceToRole(String roleName, Long resourceId);
    
    /**
     * Remove a resource from a role
     * 
     * @param roleName the role name
     * @param resourceId the resource ID
     * @return the updated role
     */
    Role removeResourceFromRole(String roleName, Long resourceId);
    
    /**
     * Load user permissions and update the user entity
     * 
     * @param user the user entity to update
     */
    void loadUserPermissions(User user);
}