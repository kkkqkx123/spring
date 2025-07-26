package com.example.demo.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.PermissionService;

/**
 * Unit tests for UserDetailsServiceImpl
 */
@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    private User testUser;
    private Role adminRole;
    private Role hrRole;
    private Resource adminResource;
    private Resource hrResource;

    @BeforeEach
    void setUp() {
        // Create test roles
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ADMIN");
        adminRole.setDescription("Administrator role");

        hrRole = new Role();
        hrRole.setId(2L);
        hrRole.setName("HR_MANAGER");
        hrRole.setDescription("HR Manager role");

        // Create test resources
        adminResource = new Resource();
        adminResource.setId(1L);
        adminResource.setName("Admin Users");
        adminResource.setUrl("/api/admin/**");
        adminResource.setMethod("*");

        hrResource = new Resource();
        hrResource.setId(2L);
        hrResource.setName("HR Employees");
        hrResource.setUrl("/api/hr/**");
        hrResource.setMethod("*");

        // Set up role-resource relationships
        Set<Resource> adminResources = new HashSet<>();
        adminResources.add(adminResource);
        adminRole.setResources(adminResources);

        Set<Resource> hrResources = new HashSet<>();
        hrResources.add(hrResource);
        hrRole.setResources(hrResources);

        // Create test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("encodedPassword");
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setEnabled(true);
        testUser.setAccountNonExpired(true);
        testUser.setAccountNonLocked(true);
        testUser.setCredentialsNonExpired(true);

        Set<Role> userRoles = new HashSet<>();
        userRoles.add(adminRole);
        userRoles.add(hrRole);
        testUser.setRoles(userRoles);
    }

    @Test
    @DisplayName("Should load user details successfully when user exists")
    void testLoadUserByUsername_UserExists_ShouldReturnUserDetails() {
        // Given
        String username = "testuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doNothing().when(permissionService).loadUserPermissions(testUser);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Then
        assertNotNull(userDetails);
        assertEquals(username, userDetails.getUsername());
        assertEquals("encodedPassword", userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());

        // Verify authorities
        assertFalse(userDetails.getAuthorities().isEmpty());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")));
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_HR_MANAGER")));

        // Verify method calls
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user does not exist")
    void testLoadUserByUsername_UserNotExists_ShouldThrowException() {
        // Given
        String username = "nonexistentuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // When & Then
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername(username)
        );

        assertEquals("User not found with username: " + username, exception.getMessage());
        verify(userRepository).findByUsername(username);
        verify(permissionService, never()).loadUserPermissions(any(User.class));
    }

    @Test
    @DisplayName("Should handle permission service errors gracefully")
    void testLoadUserByUsername_PermissionServiceError_ShouldThrowRuntimeException() {
        // Given
        String username = "testuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doThrow(new RuntimeException("Permission service error"))
                .when(permissionService).loadUserPermissions(testUser);

        // When & Then
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> userDetailsService.loadUserByUsername(username)
        );

        assertEquals("Error loading user permissions", exception.getMessage());
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }

    @Test
    @DisplayName("Should load user with disabled account")
    void testLoadUserByUsername_DisabledUser_ShouldReturnUserDetailsWithDisabledFlag() {
        // Given
        String username = "disableduser";
        testUser.setEnabled(false);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doNothing().when(permissionService).loadUserPermissions(testUser);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Then
        assertNotNull(userDetails);
        assertFalse(userDetails.isEnabled());
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }

    @Test
    @DisplayName("Should load user with expired account")
    void testLoadUserByUsername_ExpiredAccount_ShouldReturnUserDetailsWithExpiredFlag() {
        // Given
        String username = "expireduser";
        testUser.setAccountNonExpired(false);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doNothing().when(permissionService).loadUserPermissions(testUser);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Then
        assertNotNull(userDetails);
        assertFalse(userDetails.isAccountNonExpired());
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }

    @Test
    @DisplayName("Should load user with locked account")
    void testLoadUserByUsername_LockedAccount_ShouldReturnUserDetailsWithLockedFlag() {
        // Given
        String username = "lockeduser";
        testUser.setAccountNonLocked(false);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doNothing().when(permissionService).loadUserPermissions(testUser);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Then
        assertNotNull(userDetails);
        assertFalse(userDetails.isAccountNonLocked());
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }

    @Test
    @DisplayName("Should load user with expired credentials")
    void testLoadUserByUsername_ExpiredCredentials_ShouldReturnUserDetailsWithExpiredCredentialsFlag() {
        // Given
        String username = "expiredcredentialsuser";
        testUser.setCredentialsNonExpired(false);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doNothing().when(permissionService).loadUserPermissions(testUser);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Then
        assertNotNull(userDetails);
        assertFalse(userDetails.isCredentialsNonExpired());
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }

    @Test
    @DisplayName("Should load user with no roles")
    void testLoadUserByUsername_UserWithNoRoles_ShouldReturnUserDetailsWithEmptyAuthorities() {
        // Given
        String username = "noroleuser";
        testUser.setRoles(new HashSet<>());
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        doNothing().when(permissionService).loadUserPermissions(testUser);

        // When
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // Then
        assertNotNull(userDetails);
        assertTrue(userDetails.getAuthorities().isEmpty());
        verify(userRepository).findByUsername(username);
        verify(permissionService).loadUserPermissions(testUser);
    }
}