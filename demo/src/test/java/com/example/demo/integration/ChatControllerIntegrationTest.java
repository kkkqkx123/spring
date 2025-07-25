package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.repository.MessageRepository;

import java.time.LocalDateTime;

/**
 * Integration tests for Chat REST endpoints
 */
class ChatControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MessageRepository messageRepository;

    private MessageContent testChatMessage;

    @BeforeEach
    void setUpChatTest() {
        // Clean chat data
        messageRepository.deleteAll();

        // Create test chat message
        testChatMessage = new MessageContent();
        testChatMessage.setContent("Hello, this is a test chat message");
        testChatMessage.setCreatedAt(LocalDateTime.now());
        testChatMessage.setSenderId(adminUser.getId());
        testChatMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);
        testChatMessage = messageRepository.save(testChatMessage);
    }

    @Test
    void testGetChatMessages_AsRegularUser_ShouldReturnMessages() throws Exception {
        mockMvc.perform(get("/api/chat/messages")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].content").value("Hello, this is a test chat message"))
                .andExpect(jsonPath("$.content[0].senderId").value(adminUser.getId()));
    }

    @Test
    void testGetChatMessages_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/chat/messages"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testSendChatMessage_AsRegularUser_ShouldCreateMessage() throws Exception {
        MessageContent newMessage = new MessageContent();
        newMessage.setContent("This is a new chat message from regular user");
        newMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);

        mockMvc.perform(post("/api/chat/messages")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newMessage)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("This is a new chat message from regular user"))
                .andExpect(jsonPath("$.senderId").value(regularUser.getId()));
    }

    @Test
    void testSendChatMessage_AsAdmin_ShouldCreateMessage() throws Exception {
        MessageContent newMessage = new MessageContent();
        newMessage.setContent("Admin message in chat");
        newMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);

        mockMvc.perform(post("/api/chat/messages")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newMessage)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Admin message in chat"))
                .andExpect(jsonPath("$.senderId").value(adminUser.getId()));
    }

    @Test
    void testSendChatMessage_EmptyContent_ShouldReturn400() throws Exception {
        MessageContent emptyMessage = new MessageContent();
        emptyMessage.setContent("");
        emptyMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);

        mockMvc.perform(post("/api/chat/messages")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyMessage)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetChatMessageById_AsRegularUser_ShouldReturnMessage() throws Exception {
        mockMvc.perform(get("/api/chat/messages/{id}", testChatMessage.getId())
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testChatMessage.getId()))
                .andExpect(jsonPath("$.content").value("Hello, this is a test chat message"));
    }

    @Test
    void testGetChatMessageById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/chat/messages/{id}", 999L)
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateChatMessage_AsOwner_ShouldUpdateMessage() throws Exception {
        testChatMessage.setContent("Updated chat message content");

        mockMvc.perform(put("/api/chat/messages/{id}", testChatMessage.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testChatMessage)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated chat message content"));
    }

    @Test
    void testUpdateChatMessage_AsNonOwner_ShouldReturn403() throws Exception {
        testChatMessage.setContent("Unauthorized update attempt");

        mockMvc.perform(put("/api/chat/messages/{id}", testChatMessage.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testChatMessage)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteChatMessage_AsOwner_ShouldDeleteMessage() throws Exception {
        mockMvc.perform(delete("/api/chat/messages/{id}", testChatMessage.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify message is deleted
        mockMvc.perform(get("/api/chat/messages/{id}", testChatMessage.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteChatMessage_AsNonOwner_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/chat/messages/{id}", testChatMessage.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetRecentChatMessages_AsRegularUser_ShouldReturnRecentMessages() throws Exception {
        // Create additional messages
        for (int i = 0; i < 5; i++) {
            MessageContent message = new MessageContent();
            message.setContent("Recent message " + i);
            message.setCreatedAt(LocalDateTime.now().plusMinutes(i));
            message.setSenderId(regularUser.getId());
            message.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);
            messageRepository.save(message);
        }

        mockMvc.perform(get("/api/chat/messages/recent")
                .param("limit", "3")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void testSearchChatMessages_AsRegularUser_ShouldReturnFilteredMessages() throws Exception {
        mockMvc.perform(get("/api/chat/messages/search")
                .param("query", "test")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].content").value("Hello, this is a test chat message"));
    }

    @Test
    void testGetChatMessagesByDateRange_AsRegularUser_ShouldReturnFilteredMessages() throws Exception {
        String startDate = LocalDateTime.now().minusHours(1).toString();
        String endDate = LocalDateTime.now().plusHours(1).toString();

        mockMvc.perform(get("/api/chat/messages/date-range")
                .param("startDate", startDate)
                .param("endDate", endDate)
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].content").value("Hello, this is a test chat message"));
    }
}