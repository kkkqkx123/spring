package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import jakarta.persistence.EntityManager;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.SystemMessageRepository;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasItem;

/**
 * Integration tests for Notification REST endpoints
 */
class NotificationControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SystemMessageRepository systemMessageRepository;

    @Autowired
    private EntityManager entityManager;

    private MessageContent testMessage;
    private SystemMessage testSystemMessage;

    @BeforeEach
    void setUpNotificationTest() {
        // Clean notification data
        systemMessageRepository.deleteAll();
        messageRepository.deleteAll();

        // Create test message
        testMessage = new MessageContent();
        testMessage.setContent("Test notification message");
        testMessage.setCreatedAt(LocalDateTime.now());
        testMessage.setSenderId(adminUser.getId());
        testMessage.setMessageType(MessageContent.MessageType.SYSTEM_NOTIFICATION);
        testMessage = messageRepository.save(testMessage);

        // Create test system message
        testSystemMessage = new SystemMessage();
        testSystemMessage.setUserId(regularUser.getId());
        testSystemMessage.setMessageId(testMessage.getId());
        testSystemMessage.setIsRead(false);
        testSystemMessage.setCreatedAt(LocalDateTime.now());
        testSystemMessage = systemMessageRepository.save(testSystemMessage);
    }

    @Test
    void testGetUserNotifications_AsRegularUser_ShouldReturnUserNotifications() throws Exception {
        mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].messageId").value(testMessage.getId()))
                .andExpect(jsonPath("$.content[0].isRead").value(false));
    }

    @Test
    void testGetUserNotifications_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetUnreadNotifications_AsRegularUser_ShouldReturnUnreadOnly() throws Exception {
        mockMvc.perform(get("/api/notifications")
                .param("unreadOnly", "true")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].isRead").value(false));
    }

    @Test
    void testMarkNotificationAsRead_AsRegularUser_ShouldMarkAsRead() throws Exception {
        mockMvc.perform(put("/api/notifications/{id}/read", testSystemMessage.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());

        // Verify notification is marked as read
        mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].isRead").value(true));
    }

    @Test
    void testMarkNotificationAsRead_WrongUser_ShouldReturn403() throws Exception {
        mockMvc.perform(put("/api/notifications/{id}/read", testSystemMessage.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testMarkAllNotificationsAsRead_AsRegularUser_ShouldMarkAllAsRead() throws Exception {
        // Create another notification for the same user
        MessageContent message2 = new MessageContent();
        message2.setContent("Second test message");
        message2.setCreatedAt(LocalDateTime.now());
        message2.setSenderId(adminUser.getId());
        message2.setMessageType(MessageContent.MessageType.SYSTEM_NOTIFICATION);
        message2 = messageRepository.save(message2);

        SystemMessage systemMessage2 = new SystemMessage();
        systemMessage2.setUserId(regularUser.getId());
        systemMessage2.setMessageId(message2.getId());
        systemMessage2.setIsRead(false);
        systemMessage2.setCreatedAt(LocalDateTime.now());
        systemMessageRepository.save(systemMessage2);

        mockMvc.perform(put("/api/notifications/read-all")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());

        // Verify all notifications are marked as read
        mockMvc.perform(get("/api/notifications")
                .param("unreadOnly", "true")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void testDeleteNotification_AsRegularUser_ShouldDeleteNotification() throws Exception {
        mockMvc.perform(delete("/api/notifications/{id}", testSystemMessage.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());

        // Verify notification is deleted
        mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void testDeleteNotification_WrongUser_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/notifications/{id}", testSystemMessage.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateNotification_AsAdmin_ShouldCreateNotification() throws Exception {
        MessageContent newMessage = new MessageContent();
        newMessage.setContent("New system notification");
        newMessage.setMessageType(MessageContent.MessageType.SYSTEM_NOTIFICATION);

        mockMvc.perform(post("/api/notifications/broadcast")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newMessage)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("New system notification"));
    }

    @Test
    void testCreateNotification_AsRegularUser_ShouldReturn403() throws Exception {
        MessageContent newMessage = new MessageContent();
        newMessage.setContent("Unauthorized notification");
        newMessage.setMessageType(MessageContent.MessageType.SYSTEM_NOTIFICATION);

        mockMvc.perform(post("/api/notifications/broadcast")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newMessage)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testBroadcastNotification_AsAdmin_ShouldCreateForAllUsers() throws Exception {
        // Clean existing notifications to avoid conflicts
        systemMessageRepository.deleteAll();
        messageRepository.deleteAll();
        
        MessageContent broadcastMessage = new MessageContent();
        broadcastMessage.setContent("Broadcast notification to all users");
        broadcastMessage.setMessageType(MessageContent.MessageType.BROADCAST);

        mockMvc.perform(post("/api/notifications/broadcast")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(broadcastMessage)))
                .andExpect(status().isCreated());

        // Force flush to ensure data is persisted
        entityManager.flush();
        entityManager.clear();

        // Verify all users received the notification
        String response = mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
                
        System.out.println("Response content: " + response);
                
        mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.content == 'Broadcast notification to all users')].content")
                        .value(hasItem("Broadcast notification to all users")));
    }

    @Test
    void testGetNotificationCount_AsRegularUser_ShouldReturnCount() throws Exception {
        mockMvc.perform(get("/api/notifications/count")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(1));
    }
}