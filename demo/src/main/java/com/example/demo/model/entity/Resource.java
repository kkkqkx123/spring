package com.example.demo.model.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resource entity for permission management
 */
@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Resource extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Resource name is required")
    @Size(min = 3, max = 100, message = "Resource name must be between 3 and 100 characters")
    private String name;
    
    @NotBlank(message = "URL is required")
    @Size(max = 255, message = "URL cannot exceed 255 characters")
    private String url;
    
    @NotBlank(message = "HTTP method is required")
    @Pattern(regexp = "GET|POST|PUT|DELETE|PATCH|\\*", message = "Method must be GET, POST, PUT, DELETE, PATCH, or *")
    @Size(max = 10, message = "Method cannot exceed 10 characters")
    private String method;
    
    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;
    
    @ManyToMany(mappedBy = "resources", fetch = FetchType.LAZY)
    private Set<Role> roles = new HashSet<>();
    
    /**
     * Check if this resource matches a given URL and method
     * 
     * @param requestUrl the URL to check
     * @param requestMethod the HTTP method to check
     * @return true if the resource matches, false otherwise
     */
    public boolean matches(String requestUrl, String requestMethod) {
        boolean urlMatches = url.equals(requestUrl) || 
                            (url.endsWith("/**") && requestUrl.startsWith(url.substring(0, url.length() - 3)));
        
        boolean methodMatches = method.equals("*") || method.equals(requestMethod);
        
        return urlMatches && methodMatches;
    }
}