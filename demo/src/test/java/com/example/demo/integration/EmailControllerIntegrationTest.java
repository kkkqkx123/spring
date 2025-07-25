package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.dto.EmailRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Integration tests for Email REST endpoints
 */
class EmailControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void testSendEmail_AsAdmin_ShouldSendEmail() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo("test@example.com");
        emailRequest.setSubject("Test Email");
        emailRequest.setTemplate("welcome");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", "John Doe");
        variables.put("company", "Test Company");
        emailRequest.setVariables(variables);

        mockMvc.perform(post("/api/email/send")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email sent successfully"));
    }

    @Test
    void testSendEmail_AsHRManager_ShouldSendEmail() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo("employee@example.com");
        emailRequest.setSubject("HR Notification");
        emailRequest.setTemplate("notification");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("message", "Please update your information");
        emailRequest.setVariables(variables);

        mockMvc.perform(post("/api/email/send")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isOk());
    }

    @Test
    void testSendEmail_AsRegularUser_ShouldReturn403() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo("test@example.com");
        emailRequest.setSubject("Unauthorized Email");
        emailRequest.setTemplate("welcome");

        mockMvc.perform(post("/api/email/send")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testSendEmail_Unauthenticated_ShouldReturn401() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo("test@example.com");
        emailRequest.setSubject("Test Email");
        emailRequest.setTemplate("welcome");

        mockMvc.perform(post("/api/email/send")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testSendBulkEmail_AsAdmin_ShouldSendToMultipleRecipients() throws Exception {
        EmailRequest bulkEmailRequest = new EmailRequest();
        bulkEmailRequest.setRecipients(List.of("user1@example.com", "user2@example.com", "user3@example.com"));
        bulkEmailRequest.setSubject("Bulk Email Test");
        bulkEmailRequest.setTemplate("announcement");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("title", "Important Announcement");
        variables.put("content", "This is a bulk email test");
        bulkEmailRequest.setVariables(variables);

        mockMvc.perform(post("/api/email/send-bulk")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bulkEmailRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Bulk emails sent successfully"))
                .andExpect(jsonPath("$.count").value(3));
    }

    @Test
    void testSendBulkEmail_AsRegularUser_ShouldReturn403() throws Exception {
        EmailRequest bulkEmailRequest = new EmailRequest();
        bulkEmailRequest.setRecipients(List.of("user1@example.com", "user2@example.com"));
        bulkEmailRequest.setSubject("Unauthorized Bulk Email");
        bulkEmailRequest.setTemplate("announcement");

        mockMvc.perform(post("/api/email/send-bulk")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bulkEmailRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testSendEmailToEmployee_AsAdmin_ShouldSendToSpecificEmployee() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setSubject("Employee Specific Email");
        emailRequest.setTemplate("employee_notification");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("employeeName", testEmployee1.getName());
        variables.put("message", "Your profile has been updated");
        emailRequest.setVariables(variables);

        mockMvc.perform(post("/api/email/send-to-employee/{employeeId}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email sent to employee successfully"));
    }

    @Test
    void testSendEmailToEmployee_NonExistentEmployee_ShouldReturn404() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setSubject("Test Email");
        emailRequest.setTemplate("employee_notification");

        mockMvc.perform(post("/api/email/send-to-employee/{employeeId}", 999L)
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testSendEmailToDepartment_AsAdmin_ShouldSendToDepartmentEmployees() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setSubject("Department Announcement");
        emailRequest.setTemplate("department_notification");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("departmentName", itDepartment.getName());
        variables.put("announcement", "Department meeting scheduled");
        emailRequest.setVariables(variables);

        mockMvc.perform(post("/api/email/send-to-department/{departmentId}", itDepartment.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email sent to department successfully"));
    }

    @Test
    void testGetEmailTemplates_AsAdmin_ShouldReturnAvailableTemplates() throws Exception {
        mockMvc.perform(get("/api/email/templates")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.name=='welcome')]").exists())
                .andExpect(jsonPath("$[?(@.name=='notification')]").exists());
    }

    @Test
    void testGetEmailTemplates_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/email/templates")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testPreviewEmailTemplate_AsAdmin_ShouldReturnPreview() throws Exception {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", "John Doe");
        variables.put("company", "Test Company");

        mockMvc.perform(post("/api/email/templates/{templateName}/preview", "welcome")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(variables)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.html").exists())
                .andExpect(jsonPath("$.subject").exists());
    }

    @Test
    void testSendEmail_InvalidTemplate_ShouldReturn400() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo("test@example.com");
        emailRequest.setSubject("Test Email");
        emailRequest.setTemplate("nonexistent_template");

        mockMvc.perform(post("/api/email/send")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSendEmail_InvalidEmailAddress_ShouldReturn400() throws Exception {
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo("invalid-email");
        emailRequest.setSubject("Test Email");
        emailRequest.setTemplate("welcome");

        mockMvc.perform(post("/api/email/send")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isBadRequest());
    }
}