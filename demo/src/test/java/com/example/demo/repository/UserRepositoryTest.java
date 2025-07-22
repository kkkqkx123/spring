package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;

/**
 * Integration tests for UserRepository
 */
@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Test
    void testFindByUsername_WhenUserExists_ReturnsUser() {
        // Create and persist a user
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("password");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();
        
        // Find by username
        Optional<User> found = userRepository.findByUsername("testuser");
        
        // Verify
        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getUsername());
    }
    
    @Test
    void testFindByUsername_WhenUserDoesNotExist_ReturnsEmpty() {
        // Find by non-existent username
        Optional<User> found = userRepository.findByUsername("nonexistent");
        
        // Verify
        assertFalse(found.isPresent());
    }
    
    @Test
    void testExistsByUsername_WhenUserExists_ReturnsTrue() {
        // Create and persist a user
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("password");
        user.setEmail("test@example.com");
        entityManager.persist(user);
        entityManager.flush();
        
        // Check if username exists
        boolean exists = userRepository.existsByUsername("testuser");
        
        // Verify
        assertTrue(exists);
    }
    
    @Test
    void testExistsByUsername_WhenUserDoesNotExist_ReturnsFalse() {
        // Check if non-existent username exists
        boolean exists = userRepository.existsByUsername("nonexistent");
        
        // Verify
        assertFalse(exists);
    }
    
    @Test
    void testFindByRoleName_WhenUsersHaveRole_ReturnsUsers() {
        // Create and persist a role
        Role role = new Role();
        role.setName("ROLE_ADMIN");
        role = entityManager.persist(role);
        
        // Create and persist users with the role
        User user1 = new User();
        user1.setUsername("admin1");
        user1.setPassword("password");
        user1.setEmail("admin1@example.com");
        Set<Role> roles1 = new HashSet<>();
        roles1.add(role);
        user1.setRoles(roles1);
        entityManager.persist(user1);
        
        User user2 = new User();
        user2.setUsername("admin2");
        user2.setPassword("password");
        user2.setEmail("admin2@example.com");
        Set<Role> roles2 = new HashSet<>();
        roles2.add(role);
        user2.setRoles(roles2);
        entityManager.persist(user2);
        
        // Create and persist a user without the role
        User user3 = new User();
        user3.setUsername("user");
        user3.setPassword("password");
        user3.setEmail("user@example.com");
        entityManager.persist(user3);
        
        entityManager.flush();
        
        // Find users by role name
        Page<User> admins = userRepository.findByRoleName("ROLE_ADMIN", PageRequest.of(0, 10));
        
        // Verify
        assertEquals(2, admins.getTotalElements());
        assertTrue(admins.getContent().stream().anyMatch(u -> u.getUsername().equals("admin1")));
        assertTrue(admins.getContent().stream().anyMatch(u -> u.getUsername().equals("admin2")));
    }
    
    @Test
    void testSearchUsers_WhenUsersMatchSearchTerm_ReturnsUsers() {
        // Create and persist users
        User user1 = new User();
        user1.setUsername("johndoe");
        user1.setPassword("password");
        user1.setEmail("john@example.com");
        user1.setFirstName("John");
        user1.setLastName("Doe");
        entityManager.persist(user1);
        
        User user2 = new User();
        user2.setUsername("janedoe");
        user2.setPassword("password");
        user2.setEmail("jane@example.com");
        user2.setFirstName("Jane");
        user2.setLastName("Doe");
        entityManager.persist(user2);
        
        User user3 = new User();
        user3.setUsername("bobsmith");
        user3.setPassword("password");
        user3.setEmail("bob@example.com");
        user3.setFirstName("Bob");
        user3.setLastName("Smith");
        entityManager.persist(user3);
        
        entityManager.flush();
        
        // Search users by last name
        Page<User> doeUsers = userRepository.searchUsers("doe", PageRequest.of(0, 10));
        
        // Verify
        assertEquals(2, doeUsers.getTotalElements());
        assertTrue(doeUsers.getContent().stream().anyMatch(u -> u.getUsername().equals("johndoe")));
        assertTrue(doeUsers.getContent().stream().anyMatch(u -> u.getUsername().equals("janedoe")));
        
        // Search users by email
        Page<User> bobUsers = userRepository.searchUsers("bob", PageRequest.of(0, 10));
        
        // Verify
        assertEquals(1, bobUsers.getTotalElements());
        assertTrue(bobUsers.getContent().stream().anyMatch(u -> u.getUsername().equals("bobsmith")));
    }
}