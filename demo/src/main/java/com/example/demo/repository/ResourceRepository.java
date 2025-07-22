package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Resource;

/**
 * Repository for Resource entity
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    /**
     * Find a resource by URL and HTTP method
     * 
     * @param url the URL pattern
     * @param method the HTTP method
     * @return an Optional containing the resource if found
     */
    Optional<Resource> findByUrlAndMethod(String url, String method);
    
    /**
     * Find all resources with a specific URL pattern
     * 
     * @param url the URL pattern
     * @return a list of resources matching the URL pattern
     */
    List<Resource> findByUrlContaining(String url);
    
    /**
     * Find all resources for a specific role
     * 
     * @param roleId the role ID
     * @return a list of resources accessible by the role
     */
    @Query("SELECT res FROM Resource res JOIN res.roles r WHERE r.id = :roleId")
    List<Resource> findResourcesByRoleId(@Param("roleId") Long roleId);
    
    /**
     * Find all resources by HTTP method
     * 
     * @param method the HTTP method
     * @return a list of resources with the specified method
     */
    List<Resource> findByMethod(String method);
}