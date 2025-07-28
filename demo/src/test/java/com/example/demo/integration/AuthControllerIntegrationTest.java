package com.example.demo.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.dto.LoginRequest;
import com.example.demo.model.dto.RegisterRequest;

/**
 * Integration tests for Authentication REST endpoints
 */
class AuthControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void testLogin_ValidCredentials_ShouldReturnToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        mockMvc.perform(post("/api/auth/login")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.roles").isArray());
    }

    @Test
    void testLogin_InvalidCredentials_ShouldReturn401() throws Exception {
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
    void testLogin_NonExistentUser_ShouldReturn401() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nonexistent");
        loginRequest.setPassword("password");

        mockMvc.perform(post("/api/auth/login")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegister_ValidData_ShouldCreateUser() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("newuser@example.com"));
    }

    @Test
    void testRegister_DuplicateUsername_ShouldReturn400() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("admin"); // Already exists
        registerRequest.setEmail("admin2@example.com");
        registerRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegister_DuplicateEmail_ShouldReturn400() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser2");
        registerRequest.setEmail("admin@example.com"); // Already exists
        registerRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegister_InvalidEmail_ShouldReturn400() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser3");
        registerRequest.setEmail("invalid-email");
        registerRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegister_WeakPassword_ShouldReturn400() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser4");
        registerRequest.setEmail("newuser4@example.com");
        registerRequest.setPassword("123"); // Too weak

        mockMvc.perform(post("/api/auth/register")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testLogout_AuthenticatedUser_ShouldReturn200() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .with(SecurityMockMvcRequestPostProcessors.user("admin")))
                .andExpect(status().isOk());
    }

    @Test
    void testRefreshToken_ValidToken_ShouldReturnNewToken() throws Exception {
        // First login to get a token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        String response = mockMvc.perform(post("/api/auth/login")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract token from response
        com.fasterxml.jackson.databind.JsonNode jsonNode = objectMapper.readTree(response);
        String token = jsonNode.get("token").asText();

        mockMvc.perform(post("/api/auth/refresh")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }
}