package com.example.demo.model.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Role entity for permission management
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Role name is required")
    @Size(min = 3, max = 50, message = "Role name must be between 3 and 50 characters")
    @Column(unique = true)
    private String name;
    
    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_resources",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "resource_id")
    )
    private Set<Resource> resources = new HashSet<>();
    
    /**
     * Check if role has access to a specific resource
     * 
     * @param resourceUrl the resource URL to check
     * @param method the HTTP method
     * @return true if the role has access to the resource, false otherwise
     */
    public boolean hasResourcePermission(String resourceUrl, String method) {
        return resources.stream()
                .anyMatch(resource -> 
                    resource.getUrl().equals(resourceUrl) && 
                    (resource.getMethod().equals("*") || resource.getMethod().equals(method))
                );
    }
    
    /**
     * Add a resource to this role
     * 
     * @param resource the resource to add
     */
    public void addResource(Resource resource) {
        resources.add(resource);
    }
    
    /**
     * Remove a resource from this role
     * 
     * @param resource the resource to remove
     */
    public void removeResource(Resource resource) {
        resources.remove(resource);
    }
}