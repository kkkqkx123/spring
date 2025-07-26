package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.dto.DepartmentDto;

/**
 * Debug test to isolate issues
 */
class DebugTest extends BaseIntegrationTest {

    @Test
    void testDepartmentCreation() throws Exception {
        // Create a simple department
        DepartmentDto newDepartment = new DepartmentDto();
        newDepartment.setName("Test Department");
        newDepartment.setIsParent(false);

        System.out.println("Creating department with data: " + objectMapper.writeValueAsString(newDepartment));
        System.out.println("HR Manager user: " + hrManagerUser.getUsername());
        System.out.println("HR Manager roles: " + hrManagerUser.getRoles());

        mockMvc.perform(post("/api/departments")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDepartment)))
                .andDo(result -> {
                    System.out.println("Response status: " + result.getResponse().getStatus());
                    System.out.println("Response body: " + result.getResponse().getContentAsString());
                    System.out.println("Response headers: " + result.getResponse().getHeaderNames());
                })
                .andExpect(status().isCreated());
    }
}