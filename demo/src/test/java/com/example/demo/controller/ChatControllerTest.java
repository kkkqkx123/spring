package com.example.demo.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import com.example.demo.config.TestSecurityConfig;
import com.example.demo.service.MockUserService;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Collections;

import com.example.demo.model.dto.ChatMessageRequest;
import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;
import com.example.demo.model.entity.User;
import com.example.demo.service.ChatService;
import com.example.demo.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests for ChatController
 */
@WebMvcTest(controllers = ChatController.class, 
    includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, 
    classes = {TestSecurityConfig.class, MockUserService.class}))
class ChatControllerTest {
    
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
    
    @MockBean
    private ChatService chatService;
    
    @MockBean
    private UserService userService;
    
    @MockBean
    private SimpMessagingTemplate messagingTemplate;
    
    private User currentUser;
    private User otherUser;
    private MessageContent messageContent;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setUsername("testuser");
        currentUser.setFirstName("Test");
        currentUser.setLastName("User");
        
        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");
        otherUser.setFirstName("Other");
        otherUser.setLastName("User");
        
        messageContent = new MessageContent();
        messageContent.setId(1L);
        messageContent.setContent("Test message");
        messageContent.setSenderId(1L);
        messageContent.setMessageType(MessageType.CHAT_MESSAGE);
        messageContent.setCreatedAt(LocalDateTime.now());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testSendMessage_WhenValid_ReturnsCreated() throws Exception {
        // Arrange
        ChatMessageRequest request = new ChatMessageRequest();
        request.setContent("Test message");
        request.setRecipientId(2L);
        
        when(userService.getUserFromAuthentication(any())).thenReturn(currentUser);
        when(userService.getUserById(2L)).thenReturn(otherUser);
        when(chatService.sendMessage(1L, 2L, "Test message")).thenReturn(messageContent);
        
        // Act & Assert
        mockMvc.perform(post("/api/chat/send")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(messageContent.getId()))
                .andExpect(jsonPath("$.content").value(messageContent.getContent()))
                .andExpect(jsonPath("$.senderId").value(currentUser.getId()))
                .andExpect(jsonPath("$.senderName").value(currentUser.getFullName()))
                .andExpect(jsonPath("$.recipientId").value(otherUser.getId()))
                .andExpect(jsonPath("$.recipientName").value(otherUser.getFullName()));
        
        // Verify WebSocket message was sent
        verify(messagingTemplate).convertAndSendToUser(
                eq(otherUser.getUsername()),
                eq("/queue/messages"),
                any());
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testGetConversation_ReturnsConversation() throws Exception {
        // Arrange
        List<MessageContent> messages = Arrays.asList(messageContent);
        Page<MessageContent> page = new PageImpl<>(messages);
        
        when(userService.getUserFromAuthentication(any())).thenReturn(currentUser);
        when(userService.getUserById(2L)).thenReturn(otherUser);
        when(chatService.getConversation(eq(1L), eq(2L), any(Pageable.class))).thenReturn(page);
        when(userService.getUserById(1L)).thenReturn(currentUser);
        
        // Act & Assert
        mockMvc.perform(get("/api/chat/conversation/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(messageContent.getId()))
                .andExpect(jsonPath("$.content[0].content").value(messageContent.getContent()))
                .andExpect(jsonPath("$.content[0].senderId").value(currentUser.getId()))
                .andExpect(jsonPath("$.content[0].senderName").value(currentUser.getFullName()));
        
        // Verify messages were marked as read
        verify(chatService).markConversationAsRead(1L, 2L);
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testGetRecentConversations_ReturnsUsers() throws Exception {
        // Arrange
        List<Long> userIds = Arrays.asList(2L, 3L);
        List<User> users = Arrays.asList(otherUser);
        
        when(userService.getUserFromAuthentication(any())).thenReturn(currentUser);
        when(chatService.getRecentConversations(1L)).thenReturn(userIds);
        when(userService.getUserById(2L)).thenReturn(otherUser);
        when(userService.getUserById(3L)).thenReturn(null); // User not found
        
        // Act & Assert
        mockMvc.perform(get("/api/chat/conversations")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(otherUser.getId()))
                .andExpect(jsonPath("$[0].username").value(otherUser.getUsername()));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testMarkConversationAsRead_ReturnsCount() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(currentUser);
        when(chatService.markConversationAsRead(1L, 2L)).thenReturn(3);
        
        // Act & Assert
        mockMvc.perform(put("/api/chat/conversation/2/read")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));
    }
    
    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void testGetUnreadCount_ReturnsCount() throws Exception {
        // Arrange
        when(userService.getUserFromAuthentication(any())).thenReturn(currentUser);
        when(chatService.countUnreadMessages(1L)).thenReturn(5L);
        
        // Act & Assert
        mockMvc.perform(get("/api/chat/unread/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));
    }
}