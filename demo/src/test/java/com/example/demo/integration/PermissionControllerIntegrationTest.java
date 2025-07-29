package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;

import java.util.Set;

/**
 * Integration tests for Permission REST endpoints
 */
class PermissionControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void testGetAllRoles_AsAdmin_ShouldReturnRoles() throws Exception {
        mockMvc.perform(get("/api/permissions/roles")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[?(@.name=='ROLE_ADMIN')]").exists())
                .andExpect(jsonPath("$[?(@.name=='ROLE_HR_MANAGER')]").exists())
                .andExpect(jsonPath("$[?(@.name=='ROLE_USER')]").exists());
    }

    @Test
    void testGetAllRoles_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/permissions/roles")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetAllRoles_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/permissions/roles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetRoleById_AsAdmin_ShouldReturnRole() throws Exception {
        mockMvc.perform(get("/api/permissions/roles/{id}", adminRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(adminRole.getId()))
                .andExpect(jsonPath("$.name").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$.description").value("System Administrator"))
                .andExpect(jsonPath("$.resources").isArray());
    }

    @Test
    void testGetRoleById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/permissions/roles/{id}", 999L)
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateRole_AsAdmin_ShouldCreateRole() throws Exception {
        Role newRole = new Role();
        newRole.setName("ROLE_MANAGER");
        newRole.setDescription("Department Manager");

        mockMvc.perform(post("/api/permissions/roles")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRole)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("ROLE_MANAGER"))
                .andExpect(jsonPath("$.description").value("Department Manager"));
    }

    @Test
    void testCreateRole_AsRegularUser_ShouldReturn403() throws Exception {
        Role newRole = new Role();
        newRole.setName("ROLE_UNAUTHORIZED_ROLE");
        newRole.setDescription("Unauthorized Role");

        mockMvc.perform(post("/api/permissions/roles")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRole)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateRole_AsAdmin_ShouldUpdateRole() throws Exception {
        userRole.setDescription("Updated Regular User Role");

        mockMvc.perform(put("/api/permissions/roles/{id}", userRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(userRole)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated Regular User Role"));
    }

    @Test
    void testDeleteRole_AsAdmin_ShouldDeleteRole() throws Exception {
        // Create a role that can be safely deleted
        Role deletableRole = createRole("ROLE_TEMP_ROLE", "Temporary Role", Set.of());

        mockMvc.perform(delete("/api/permissions/roles/{id}", deletableRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify role is deleted
        mockMvc.perform(get("/api/permissions/roles/{id}", deletableRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetAllResources_AsAdmin_ShouldReturnResources() throws Exception {
        mockMvc.perform(get("/api/permissions/resources")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.name=='EMPLOYEE_READ')]").exists())
                .andExpect(jsonPath("$[?(@.name=='EMPLOYEE_CREATE')]").exists());
    }

    @Test
    void testGetAllResources_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/permissions/resources")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateResource_AsAdmin_ShouldCreateResource() throws Exception {
        Resource newResource = new Resource();
        newResource.setName("REPORT_READ");
        newResource.setUrl("/api/reports");
        newResource.setMethod("GET");
        newResource.setDescription("Read reports");

        mockMvc.perform(post("/api/permissions/resources")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newResource)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("REPORT_READ"))
                .andExpect(jsonPath("$.url").value("/api/reports"))
                .andExpect(jsonPath("$.method").value("GET"));
    }

    @Test
    void testAssignRoleToUser_AsAdmin_ShouldAssignRole() throws Exception {
        mockMvc.perform(post("/api/permissions/users/{userId}/roles/{roleId}", 
                        regularUser.getId(), hrManagerRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role assigned successfully"));

        // Verify role assignment
        mockMvc.perform(get("/api/permissions/users/{userId}/roles", regularUser.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name=='ROLE_HR_MANAGER')]").exists());
    }

    @Test
    void testRemoveRoleFromUser_AsAdmin_ShouldRemoveRole() throws Exception {
        mockMvc.perform(delete("/api/permissions/users/{userId}/roles/{roleId}", 
                        regularUser.getId(), userRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role removed successfully"));
    }

    @Test
    void testGetUserRoles_AsAdmin_ShouldReturnUserRoles() throws Exception {
        mockMvc.perform(get("/api/permissions/users/{userId}/roles", adminUser.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("ROLE_ADMIN"));
    }

    @Test
    void testGetUserRoles_AsRegularUser_OwnRoles_ShouldReturnRoles() throws Exception {
        mockMvc.perform(get("/api/permissions/users/{userId}/roles", regularUser.getId())
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("ROLE_USER"));
    }

    @Test
    void testGetUserRoles_AsRegularUser_OtherUserRoles_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/permissions/users/{userId}/roles", adminUser.getId())
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAssignResourceToRole_AsAdmin_ShouldAssignResource() throws Exception {
        // Create a new resource for testing
        Resource testResource = createResource("TEST_RESOURCE", "/api/test", "GET");
        
        System.out.println("Debug - userRole: " + userRole);
        System.out.println("Debug - testResource: " + testResource);
        System.out.println("Debug - userRole name: " + userRole.getName() + ", id: " + userRole.getId());
        System.out.println("Debug - testResource id: " + testResource.getId());

        mockMvc.perform(post("/api/permissions/roles/{roleName}/resources/{resourceId}",
                        userRole.getName(), testResource.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("ROLE_USER"))
                .andExpect(jsonPath("$.resources[?(@.id==" + testResource.getId() + ")]").exists());
    }

    @Test
    void testRemoveResourceFromRole_AsAdmin_ShouldRemoveResource() throws Exception {
        // Get a resource that's assigned to the role
        Resource assignedResource = userRole.getResources().iterator().next();

        mockMvc.perform(delete("/api/permissions/roles/{roleId}/resources/{resourceId}", 
                        userRole.getId(), assignedResource.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Resource removed from role successfully"));
    }

    @Test
    void testGetRoleResources_AsAdmin_ShouldReturnRoleResources() throws Exception {
        mockMvc.perform(get("/api/permissions/roles/{roleId}/resources", adminRole.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.name=='EMPLOYEE_READ')]").exists());
    }

    @Test
    void testCheckUserPermission_AsAdmin_ShouldReturnPermissionStatus() throws Exception {
        mockMvc.perform(get("/api/permissions/users/{userId}/check", adminUser.getId())
                .param("resource", "EMPLOYEE_READ")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPermission").value(true))
                .andExpect(jsonPath("$.resource").value("EMPLOYEE_READ"));
    }

    @Test
    void testCheckUserPermission_AsRegularUser_OwnPermission_ShouldReturnStatus() throws Exception {
        mockMvc.perform(get("/api/permissions/users/{userId}/check", regularUser.getId())
                .param("resource", "EMPLOYEE_READ")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPermission").value(true));
    }

    @Test
    void testCreateRole_DuplicateName_ShouldReturn400() throws Exception {
        Role duplicateRole = new Role();
        duplicateRole.setName("ROLE_ADMIN"); // Already exists
        duplicateRole.setDescription("Duplicate Admin Role");

        mockMvc.perform(post("/api/permissions/roles")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRole)))
                .andExpect(status().isBadRequest());
    }
}