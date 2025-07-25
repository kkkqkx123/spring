package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.dto.LoginRequest;
import com.example.demo.model.entity.Employee;

/**
 * Comprehensive security integration tests
 * Tests authentication, authorization, and role-based access control
 */
class SecurityIntegrationTest extends BaseIntegrationTest {

    @Test
    void testAuthentication_ValidCredentials_ShouldAuthenticate() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        mockMvc.perform(post("/api/auth/login")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void testAuthentication_InvalidCredentials_ShouldReject() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAdminRoleAccess_AllEndpoints_ShouldHaveFullAccess() throws Exception {
        // Test employee endpoints
        mockMvc.perform(get("/api/employees")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/employees")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Employee())))
                .andExpect(status().isBadRequest()); // Bad request due to validation, but not forbidden

        mockMvc.perform(delete("/api/employees/{id}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Test department endpoints
        mockMvc.perform(get("/api/departments")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk());

        // Test position endpoints
        mockMvc.perform(get("/api/positions")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk());

        // Test payroll endpoints
        mockMvc.perform(get("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk());

        // Test permission endpoints
        mockMvc.perform(get("/api/permissions/roles")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void testHRManagerRoleAccess_ShouldHaveLimitedAccess() throws Exception {
        // Should have access to employee management
        mockMvc.perform(get("/api/employees")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/employees")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Employee())))
                .andExpect(status().isBadRequest()); // Bad request due to validation, but not forbidden

        // Should have access to departments (read-only)
        mockMvc.perform(get("/api/departments")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER")))
                .andExpect(status().isOk());

        // Should have access to positions (read-only)
        mockMvc.perform(get("/api/positions")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER")))
                .andExpect(status().isOk());

        // Should have access to payroll
        mockMvc.perform(get("/api/payroll")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER")))
                .andExpect(status().isOk());

        // Should NOT have access to permission management
        mockMvc.perform(get("/api/permissions/roles")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRegularUserRoleAccess_ShouldHaveReadOnlyAccess() throws Exception {
        // Should have read access to employees
        mockMvc.perform(get("/api/employees")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // Should NOT have create access to employees
        mockMvc.perform(post("/api/employees")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Employee())))
                .andExpect(status().isForbidden());

        // Should NOT have delete access to employees
        mockMvc.perform(delete("/api/employees/{id}", testEmployee1.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());

        // Should have read access to departments
        mockMvc.perform(get("/api/departments")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // Should have read access to positions
        mockMvc.perform(get("/api/positions")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // Should NOT have access to payroll
        mockMvc.perform(get("/api/payroll")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());

        // Should NOT have access to permission management
        mockMvc.perform(get("/api/permissions/roles")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedAccess_ShouldBeRejected() throws Exception {
        // All protected endpoints should require authentication
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/payroll"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/permissions/roles"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/chat/messages"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testCrossUserDataAccess_ShouldBeRestricted() throws Exception {
        // Regular user should only access their own notifications
        mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // Regular user should be able to access their own roles
        mockMvc.perform(get("/api/permissions/users/{userId}/roles", regularUser.getId())
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // Regular user should NOT be able to access other users' roles
        mockMvc.perform(get("/api/permissions/users/{userId}/roles", adminUser.getId())
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testMethodLevelSecurity_ShouldEnforcePermissions() throws Exception {
        // Test different HTTP methods have different permission requirements
        
        // GET should be allowed for users with read permission
        mockMvc.perform(get("/api/employees")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // POST should require create permission
        mockMvc.perform(post("/api/employees")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Employee())))
                .andExpect(status().isForbidden());

        // PUT should require update permission
        mockMvc.perform(put("/api/employees/{id}", testEmployee1.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testEmployee1)))
                .andExpect(status().isForbidden());

        // DELETE should require delete permission
        mockMvc.perform(delete("/api/employees/{id}", testEmployee1.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCSRFProtection_ShouldRequireCSRFToken() throws Exception {
        // POST requests without CSRF token should be rejected
        mockMvc.perform(post("/api/employees")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Employee())))
                .andExpect(status().isForbidden());

        // POST requests with CSRF token should be processed
        mockMvc.perform(post("/api/employees")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new Employee())))
                .andExpect(status().isBadRequest()); // Bad request due to validation, not CSRF
    }

    @Test
    void testSessionManagement_ShouldMaintainSecurity() throws Exception {
        // Test that session-based authentication works
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        // Login should create a session
        mockMvc.perform(post("/api/auth/login")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        // Logout should invalidate the session
        mockMvc.perform(post("/api/auth/logout")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .with(user("admin")))
                .andExpect(status().isOk());
    }

    @Test
    void testResourceBasedPermissions_ShouldEnforceFinegrainedAccess() throws Exception {
        // Test that specific resource permissions are enforced
        
        // Admin should have all permissions
        mockMvc.perform(get("/api/permissions/users/{userId}/check", adminUser.getId())
                .param("resource", "EMPLOYEE_READ")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPermission").value(true));

        // Regular user should have limited permissions
        mockMvc.perform(get("/api/permissions/users/{userId}/check", regularUser.getId())
                .param("resource", "EMPLOYEE_READ")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPermission").value(true));

        // Regular user should not have create permissions
        mockMvc.perform(get("/api/permissions/users/{userId}/check", regularUser.getId())
                .param("resource", "EMPLOYEE_CREATE")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPermission").value(false));
    }

    @Test
    void testPasswordSecurity_ShouldEnforceStrongPasswords() throws Exception {
        // Test password validation during registration
        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest());

        // Strong password should be accepted
        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"testuser2\",\"email\":\"test2@example.com\",\"password\":\"StrongPassword123!\"}"))
                .andExpect(status().isCreated());
    }
}