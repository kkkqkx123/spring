package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Role;

/**
 * Repository for Role entity
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    /**
     * Find a role by name
     * 
     * @param name the role name to search for
     * @return an Optional containing the role if found
     */
    Optional<Role> findByName(String name);
    
    /**
     * Check if a role name exists
     * 
     * @param name the role name to check
     * @return true if the role name exists, false otherwise
     */
    boolean existsByName(String name);
    
    /**
     * Find all roles for a specific user
     * 
     * @param userId the user ID
     * @return a list of roles assigned to the user
     */
    @Query("SELECT r FROM Role r JOIN User u ON r MEMBER OF u.roles WHERE u.id = :userId")
    List<Role> findRolesByUserId(@Param("userId") Long userId);
    
    /**
     * Find all roles with a specific resource
     * 
     * @param resourceId the resource ID
     * @return a list of roles that have access to the resource
     */
    @Query("SELECT r FROM Role r JOIN r.resources res WHERE res.id = :resourceId")
    List<Role> findRolesByResourceId(@Param("resourceId") Long resourceId);
}