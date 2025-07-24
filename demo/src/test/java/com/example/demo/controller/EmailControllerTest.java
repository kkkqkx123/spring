package com.example.demo.controller;

import com.example.demo.exception.EmailSendingException;
import com.example.demo.model.dto.BulkEmailRequest;
import com.example.demo.model.dto.EmailRequest;
import com.example.demo.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmailController.class)
class EmailControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockitoBean
        private EmailService emailService;

        @Test
        @WithMockUser(authorities = { "ROLE_HR_MANAGER" })
        void sendEmail_Success() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                variables.put("employeeName", "John Doe");
                variables.put("department", "IT");

                EmailRequest request = new EmailRequest(
                                "john.doe@example.com",
                                "Welcome to the Company",
                                "email/notification/welcome.ftl",
                                variables);

                // Act & Assert
                mockMvc.perform(post("/emails/send")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Email sent successfully"));

                verify(emailService).sendTemplatedEmail(
                                eq("john.doe@example.com"),
                                eq("Welcome to the Company"),
                                eq("email/notification/welcome.ftl"),
                                eq(variables));
        }

        @Test
        @WithMockUser(authorities = { "ROLE_HR_MANAGER" })
        void sendEmail_Failure() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                variables.put("employeeName", "John Doe");

                EmailRequest request = new EmailRequest(
                                "john.doe@example.com",
                                "Welcome to the Company",
                                "email/notification/welcome.ftl",
                                variables);

                doThrow(new EmailSendingException("Failed to send email"))
                                .when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any());

                // Act & Assert
                mockMvc.perform(post("/emails/send")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isInternalServerError())
                                .andExpect(jsonPath("$.message").value("Failed to send email: Failed to send email"));
        }

        @Test
        @WithMockUser(authorities = { "ROLE_HR_MANAGER" })
        void sendBulkEmails_Success() throws Exception {
                // Arrange
                List<String> recipients = List.of(
                                "john.doe@example.com",
                                "jane.doe@example.com",
                                "bob.smith@example.com");

                Map<String, Object> variables = new HashMap<>();
                variables.put("announcementTitle", "Company Picnic");
                variables.put("announcementContent", "Join us for a company picnic this weekend!");

                BulkEmailRequest request = new BulkEmailRequest(
                                recipients,
                                "Company Announcement",
                                "email/employee/announcement.ftl",
                                variables);

                // Act & Assert
                mockMvc.perform(post("/emails/send-bulk")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Bulk emails sent successfully"));

                verify(emailService).sendBulkEmails(
                                eq(recipients),
                                eq("Company Announcement"),
                                eq("email/employee/announcement.ftl"),
                                eq(variables));
        }

        @Test
        @WithMockUser(authorities = { "ROLE_EMPLOYEE" })
        void sendEmail_AccessDenied() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                EmailRequest request = new EmailRequest(
                                "john.doe@example.com",
                                "Test Subject",
                                "email/notification/welcome.ftl",
                                variables);

                // Act & Assert
                mockMvc.perform(post("/emails/send")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden());

                verify(emailService, never()).sendTemplatedEmail(anyString(), anyString(), anyString(), any());
        }

        @Test
        @WithMockUser(authorities = { "ROLE_HR_MANAGER" })
        void sendWelcomeEmail_Success() throws Exception {
                // Act & Assert
                mockMvc.perform(post("/emails/welcome/1")
                                .with(csrf()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message")
                                                .value("Welcome email functionality to be implemented"));
        }

        @Test
        @WithMockUser(authorities = { "ROLE_FINANCE_MANAGER" })
        void sendPayrollNotification_Success() throws Exception {
                // Act & Assert
                mockMvc.perform(post("/emails/payroll-notification/1/2")
                                .with(csrf()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message")
                                                .value("Payroll notification functionality to be implemented"));
        }

        @Test
        @WithMockUser(authorities = { "ROLE_HR_MANAGER" })
        void sendAnnouncement_Success() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                variables.put("announcementTitle", "Company Picnic");
                variables.put("announcementContent", "Join us for a company picnic this weekend!");

                EmailRequest request = new EmailRequest(
                                "all@example.com", // This would be ignored in the actual implementation
                                "Company Announcement",
                                "email/employee/announcement.ftl",
                                variables);

                // Act & Assert
                mockMvc.perform(post("/emails/announcement")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message")
                                                .value("Announcement email functionality to be implemented"));
        }
}