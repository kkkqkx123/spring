package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.entity.Position;

/**
 * Integration tests for Position REST endpoints
 */
class PositionControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void testGetAllPositions_AsAdmin_ShouldReturnPositions() throws Exception {
        mockMvc.perform(get("/api/positions")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].jobTitle").exists())
                .andExpect(jsonPath("$[0].professionalTitle").exists());
    }

    @Test
    void testGetAllPositions_AsRegularUser_ShouldReturnPositions() throws Exception {
        mockMvc.perform(get("/api/positions")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testGetAllPositions_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetPositionById_AsAdmin_ShouldReturnPosition() throws Exception {
        mockMvc.perform(get("/api/positions/{id}", developerPosition.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(developerPosition.getId()))
                .andExpect(jsonPath("$.jobTitle").value("Software Developer"))
                .andExpect(jsonPath("$.professionalTitle").value("Senior Developer"));
    }

    @Test
    void testGetPositionById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/positions/{id}", 999L)
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreatePosition_AsAdmin_ShouldCreatePosition() throws Exception {
        Position newPosition = new Position();
        newPosition.setJobTitle("QA Engineer");
        newPosition.setProfessionalTitle("Senior QA Engineer");
        newPosition.setDescription("Quality Assurance Engineer");
        newPosition.setDepartment(itDepartment);

        mockMvc.perform(post("/api/positions")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPosition)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.jobTitle").value("QA Engineer"))
                .andExpect(jsonPath("$.professionalTitle").value("Senior QA Engineer"));
    }

    @Test
    void testCreatePosition_AsRegularUser_ShouldReturn403() throws Exception {
        Position newPosition = new Position();
        newPosition.setJobTitle("Business Analyst");
        newPosition.setProfessionalTitle("Senior Business Analyst");
        newPosition.setDepartment(itDepartment);

        mockMvc.perform(post("/api/positions")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPosition)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdatePosition_AsAdmin_ShouldUpdatePosition() throws Exception {
        developerPosition.setJobTitle("Senior Software Developer");
        developerPosition.setProfessionalTitle("Lead Developer");

        mockMvc.perform(put("/api/positions/{id}", developerPosition.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(developerPosition)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").value("Senior Software Developer"))
                .andExpect(jsonPath("$.professionalTitle").value("Lead Developer"));
    }

    @Test
    void testDeletePosition_AsAdmin_ShouldDeletePosition() throws Exception {
        mockMvc.perform(delete("/api/positions/{id}", managerPosition.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify position is deleted
        mockMvc.perform(get("/api/positions/{id}", managerPosition.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeletePosition_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/positions/{id}", managerPosition.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetPositionsByDepartment_AsAdmin_ShouldReturnDepartmentPositions() throws Exception {
        mockMvc.perform(get("/api/positions/department/{departmentId}", itDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].jobTitle").value("Software Developer"));
    }

    @Test
    void testSearchPositions_AsAdmin_ShouldReturnFilteredResults() throws Exception {
        mockMvc.perform(get("/api/positions/search")
                .param("jobTitle", "Developer")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].jobTitle").value("Software Developer"));
    }
}