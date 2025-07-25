package com.example.demo.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import com.example.demo.config.TestSecurityConfig;
import com.example.demo.service.MockUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;


import com.example.demo.model.dto.NotificationRequest;
import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.model.entity.User;
import com.example.demo.service.NotificationService;
import com.example.demo.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests for NotificationController
 */
@WebMvcTest(controllers = NotificationController.class, 
    includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, 
    classes = {TestSecurityConfig.class, MockUserService.class}))
class NotificationControllerTest {
    
    @Autowired
    private WebApplicationContext context;
    
    private MockMvc mockMvc;
    
    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
                
        // Set up authentication for tests that don't use @WithMockUser
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "testuser", 
                "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockitoBean
    private NotificationService notificationService;
    
    @MockitoBean
    private UserService userService;
    
    private User user;
    private MessageContent messageContent;
    private SystemMessage systemMessage;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setFirstName("Test");
        user.setLastName("User");
        
        messageContent = new MessageContent();
        messageContent.setId(1L);
        messageContent.setContent("Test notification");
        messageContent.setSenderId(0L);
        messageContent.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        messageContent.setCreatedAt(LocalDateTime.now());
        
        systemMessage = new SystemMessage();
        systemMessage.setId(1L);
        systemMessage.setUserId(1L);
        systemMessage.setMessageId(1L);
        systemMessage.setIsRead(false);
        systemMessage.setMessageContent(messageContent);
        systemMessage.setCreatedAt(LocalDateTime.now());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testGetNotifications_ReturnsNotifications() throws Exception {
        // Arrange
        Page<SystemMessage> page = new PageImpl<>(Collections.singletonList(systemMessage));
        when(userService.getUserFromAuthentication(any())).thenReturn(user);
        when(notificationService.getUserNotifications(eq(1L), any(Pageable.class))).thenReturn(page);
        
        // Act & Assert
        mockMvc.perform(get("/api/notifications")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(systemMessage.getId()))
                .andExpect(jsonPath("$.content[0].messageId").value(messageContent.getId()))
                .andExpect(jsonPath("$.content[0].content").value(messageContent.getContent()));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testGetUnreadCount_ReturnsCount() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(user);
        when(notificationService.countUnreadNotifications(1L)).thenReturn(5L);
        
        // Act & Assert
        mockMvc.perform(get("/api/notifications/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testMarkAsRead_WhenSuccessful_ReturnsOk() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(user);
        when(notificationService.markAsRead(1L, 1L)).thenReturn(true);
        
        // Act & Assert
        mockMvc.perform(put("/api/notifications/1/read")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testMarkAsRead_WhenNotFound_ReturnsNotFound() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(user);
        when(notificationService.markAsRead(1L, 1L)).thenReturn(false);
        
        // Act & Assert
        mockMvc.perform(put("/api/notifications/1/read")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testMarkMultipleAsRead_ReturnsCount() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(user);
        when(notificationService.markMultipleAsRead(anyList(), eq(1L))).thenReturn(2);
        
        // Act & Assert
        mockMvc.perform(put("/api/notifications/read")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Arrays.asList(1L, 2L))))
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testMarkAllAsRead_ReturnsCount() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(user);
        when(notificationService.markAllAsRead(1L)).thenReturn(5);
        
        // Act & Assert
        mockMvc.perform(put("/api/notifications/read-all")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"ADMIN"})
    void testCreateUserNotification_WhenValid_ReturnsCreated() throws Exception {
        // Arrange
        NotificationRequest request = new NotificationRequest();
        request.setContent("Test notification");
        request.setUserId(2L);
        
        when(notificationService.createNotification(2L, "Test notification")).thenReturn(messageContent);
        
        // Act & Assert
        mockMvc.perform(post("/api/notifications/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").value(messageContent.getId()))
                .andExpect(jsonPath("$.content").value(messageContent.getContent()));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"ADMIN"})
    void testCreateMultiUserNotification_WhenValid_ReturnsCreated() throws Exception {
        // Arrange
        NotificationRequest request = new NotificationRequest();
        request.setContent("Test notification");
        request.setUserIds(Arrays.asList(2L, 3L));
        
        when(notificationService.createNotificationForUsers(Arrays.asList(2L, 3L), "Test notification"))
                .thenReturn(messageContent);
        
        // Act & Assert
        mockMvc.perform(post("/api/notifications/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").value(messageContent.getId()))
                .andExpect(jsonPath("$.content").value(messageContent.getContent()));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"ADMIN"})
    void testCreateRoleNotification_WhenValid_ReturnsCreated() throws Exception {
        // Arrange
        NotificationRequest request = new NotificationRequest();
        request.setContent("Test notification");
        request.setRoleName("ROLE_USER");
        
        when(notificationService.createNotificationForRole("ROLE_USER", "Test notification"))
                .thenReturn(messageContent);
        
        // Act & Assert
        mockMvc.perform(post("/api/notifications/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").value(messageContent.getId()))
                .andExpect(jsonPath("$.content").value(messageContent.getContent()));
    }
}