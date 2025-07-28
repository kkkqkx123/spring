package com.example.demo.controller;

import com.example.demo.exception.EmailSendingException;
import com.example.demo.model.dto.EmailRequest;
import com.example.demo.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import com.example.demo.security.TestSecurityConfig;
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

@SuppressWarnings("unused")
@WebMvcTest(controllers = EmailController.class)
@Import(TestSecurityConfig.class)
class EmailControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockitoBean
        private EmailService emailService;

        @MockitoBean
        private com.example.demo.service.DepartmentService departmentService;

        @MockitoBean
        private com.example.demo.service.UserService userService;

        @MockitoBean
        private com.example.demo.service.EmployeeService employeeService;

        @MockitoBean
        private com.example.demo.service.ChatService chatService;

        @MockitoBean
        private com.example.demo.service.NotificationService notificationService;

        @MockitoBean
        private com.example.demo.service.PayrollService payrollService;

        @MockitoBean
        private com.example.demo.service.PositionService positionService;

        @MockitoBean
        private com.example.demo.service.PermissionService permissionService;

        @MockitoBean
        private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

        @Test
        @WithMockUser(roles = { "HR_MANAGER" })
        void sendEmail_Success() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                variables.put("employeeName", "John Doe");
                variables.put("department", "IT");

                EmailRequest request = new EmailRequest();
                request.setTo("john.doe@example.com");
                request.setSubject("Welcome to the Company");
                request.setTemplate("welcome");
                request.setVariables(variables);

                // Act & Assert
                mockMvc.perform(post("/api/email/send")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Email sent successfully"));

                verify(emailService).sendTemplatedEmail(
                                eq("john.doe@example.com"),
                                eq("Welcome to the Company"),
                                eq("welcome"),
                                eq(variables));
        }

        @Test
        @WithMockUser(roles = { "HR_MANAGER" })
        void sendEmail_Failure() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                variables.put("employeeName", "John Doe");

                EmailRequest request = new EmailRequest();
                request.setTo("john.doe@example.com");
                request.setSubject("Welcome to the Company");
                request.setTemplate("welcome");
                request.setVariables(variables);

                doThrow(new RuntimeException("Failed to send email"))
                                .when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any());

                // Act & Assert
                mockMvc.perform(post("/api/email/send")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isInternalServerError())
                                .andExpect(jsonPath("$.error").value("Failed to send email: Failed to send email"));
        }

        @Test
        @WithMockUser(roles = { "HR_MANAGER" })
        void sendBulkEmails_Success() throws Exception {
                // Arrange
                List<String> recipients = List.of(
                                "john.doe@example.com",
                                "jane.doe@example.com",
                                "bob.smith@example.com");

                Map<String, Object> variables = new HashMap<>();
                variables.put("announcementTitle", "Company Picnic");
                variables.put("announcementContent", "Join us for a company picnic this weekend!");

                EmailRequest request = new EmailRequest();
                request.setRecipients(recipients);
                request.setSubject("Company Announcement");
                request.setTemplate("announcement");
                request.setVariables(variables);

                // Act & Assert
                mockMvc.perform(post("/api/email/send-bulk")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Bulk emails sent successfully"));

                verify(emailService).sendBulkEmails(
                                eq(recipients),
                                eq("Company Announcement"),
                                eq("announcement"),
                                eq(variables));
        }

        @Test
        @WithMockUser(roles = { "EMPLOYEE" })
        void sendEmail_AccessDenied() throws Exception {
                // Arrange
                Map<String, Object> variables = new HashMap<>();
                EmailRequest request = new EmailRequest();
                request.setTo("john.doe@example.com");
                request.setSubject("Test Subject");
                request.setTemplate("welcome");
                request.setVariables(variables);

                // Act & Assert
                mockMvc.perform(post("/api/email/send")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden());

                verify(emailService, never()).sendTemplatedEmail(anyString(), anyString(), anyString(), any());
        }
}
