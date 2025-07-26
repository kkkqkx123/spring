package com.example.demo.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Custom UserDetails implementation for Spring Security
 * Provides user information and authorities for authentication and authorization
 */
public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    
    @JsonIgnore
    private String password;
    
    private boolean enabled;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean credentialsNonExpired;
    
    private Collection<? extends GrantedAuthority> authorities;

    /**
     * Constructor
     */
    public UserDetailsImpl(Long id, String username, String email, String firstName, String lastName, String password,
            boolean enabled, boolean accountNonExpired, boolean accountNonLocked, boolean credentialsNonExpired,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
        this.enabled = enabled;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.authorities = authorities;
    }

    /**
     * Build UserDetailsImpl from User entity
     * Includes role-based authorities with ROLE_ prefix for Spring Security
     */
    public static UserDetailsImpl build(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        
        // Add role-based authorities
        for (Role role : user.getRoles()) {
            // Add the role itself as an authority (role name should already have ROLE_ prefix)
            String roleName = role.getName();
            if (!roleName.startsWith("ROLE_")) {
                roleName = "ROLE_" + roleName;
            }
            authorities.add(new SimpleGrantedAuthority(roleName));
            
            // Add all resource permissions as authorities
            for (Resource resource : role.getResources()) {
                // Add resource name as authority (e.g., EMPLOYEE_READ, PAYROLL_CREATE)
                authorities.add(new SimpleGrantedAuthority(resource.getName()));
                
                // Also add method:url format for compatibility
                String permission = resource.getMethod() + ":" + resource.getUrl();
                authorities.add(new SimpleGrantedAuthority(permission));
            }
        }

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPassword(),
                user.isEnabled(),
                user.isAccountNonExpired(),
                user.isAccountNonLocked(),
                user.isCredentialsNonExpired(),
                authorities);
    }

    /**
     * Get user authorities (roles and permissions)
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /**
     * Check if user has a specific authority
     */
    public boolean hasAuthority(String authority) {
        return authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(authority));
    }

    /**
     * Check if user has a specific role
     */
    public boolean hasRole(String role) {
        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return hasAuthority(roleWithPrefix);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }
    
    public String getFirstName() {
        return firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public String getFullName() {
        StringBuilder fullName = new StringBuilder();
        if (firstName != null && !firstName.isEmpty()) {
            fullName.append(firstName);
        }
        if (lastName != null && !lastName.isEmpty()) {
            if (fullName.length() > 0) {
                fullName.append(" ");
            }
            fullName.append(lastName);
        }
        return fullName.length() > 0 ? fullName.toString() : username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}