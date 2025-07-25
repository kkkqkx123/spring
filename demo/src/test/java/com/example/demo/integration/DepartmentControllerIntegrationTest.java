package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.entity.Department;

/**
 * Integration tests for Department REST endpoints
 */
class DepartmentControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void testGetAllDepartments_AsAdmin_ShouldReturnDepartments() throws Exception {
        mockMvc.perform(get("/api/departments")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].depPath").exists());
    }

    @Test
    void testGetAllDepartments_AsRegularUser_ShouldReturnDepartments() throws Exception {
        mockMvc.perform(get("/api/departments")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetAllDepartments_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetDepartmentById_AsAdmin_ShouldReturnDepartment() throws Exception {
        mockMvc.perform(get("/api/departments/{id}", itDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(itDepartment.getId()))
                .andExpect(jsonPath("$.name").value("IT Department"))
                .andExpect(jsonPath("$.depPath").value("/IT"));
    }

    @Test
    void testGetDepartmentById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/departments/{id}", 999L)
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateDepartment_AsAdmin_ShouldCreateDepartment() throws Exception {
        Department newDepartment = new Department();
        newDepartment.setName("Finance Department");
        newDepartment.setDepPath("/Finance");
        newDepartment.setIsParent(false);

        mockMvc.perform(post("/api/departments")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDepartment)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Finance Department"))
                .andExpect(jsonPath("$.depPath").value("/Finance"));
    }

    @Test
    void testCreateDepartment_AsRegularUser_ShouldReturn403() throws Exception {
        Department newDepartment = new Department();
        newDepartment.setName("Marketing Department");
        newDepartment.setDepPath("/Marketing");

        mockMvc.perform(post("/api/departments")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDepartment)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateDepartment_AsAdmin_ShouldUpdateDepartment() throws Exception {
        itDepartment.setName("Information Technology Department");

        mockMvc.perform(put("/api/departments/{id}", itDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(itDepartment)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Information Technology Department"));
    }

    @Test
    void testDeleteDepartment_AsAdmin_ShouldDeleteDepartment() throws Exception {
        mockMvc.perform(delete("/api/departments/{id}", hrDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify department is deleted
        mockMvc.perform(get("/api/departments/{id}", hrDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteDepartment_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/departments/{id}", hrDepartment.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetDepartmentTree_AsAdmin_ShouldReturnHierarchy() throws Exception {
        // Create a child department
        Department childDepartment = createDepartment("IT Support", itDepartment.getId(), "/IT/Support", false);

        mockMvc.perform(get("/api/departments/tree")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.name=='IT Department')]").exists());
    }

    @Test
    void testGetDepartmentsByParent_AsAdmin_ShouldReturnChildren() throws Exception {
        // Create a child department
        Department childDepartment = createDepartment("IT Support", itDepartment.getId(), "/IT/Support", false);

        mockMvc.perform(get("/api/departments/parent/{parentId}", itDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("IT Support"));
    }
}