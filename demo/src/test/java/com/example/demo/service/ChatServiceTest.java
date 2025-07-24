package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.SystemMessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.impl.ChatServiceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

/**
 * Unit tests for ChatService
 */
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private SystemMessageRepository systemMessageRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private EntityManager entityManager;
    
    @Mock
    private Query query;
    
    @BeforeEach
    void initMocks() {
        // Initialize entityManager in the ChatServiceImpl
        ReflectionTestUtils.setField(chatService, "entityManager", entityManager);
    }
    
    @InjectMocks
    private ChatServiceImpl chatService;
    
    private MessageContent messageContent;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        messageContent = new MessageContent();
        messageContent.setId(1L);
        messageContent.setContent("Test message");
        messageContent.setSenderId(1L);
        messageContent.setMessageType(MessageType.CHAT_MESSAGE);
    }
    
    @Test
    void testSendMessage_WhenUsersExist_SendsMessage() {
        // Arrange
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(2L)).thenReturn(true);
        when(messageRepository.save(any(MessageContent.class))).thenReturn(messageContent);
        
        // Act
        MessageContent result = chatService.sendMessage(1L, 2L, "Test message");
        
        // Assert
        assertNotNull(result);
        assertEquals(messageContent.getId(), result.getId());
        assertEquals(messageContent.getContent(), result.getContent());
        
        // Verify message content creation
        verify(messageRepository).save(any(MessageContent.class));
        
        // Verify system message creation
        verify(systemMessageRepository).save(any(SystemMessage.class));
    }
    
    @Test
    void testSendMessage_WhenSenderDoesNotExist_ThrowsException() {
        // Arrange
        when(userRepository.existsById(1L)).thenReturn(false);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            chatService.sendMessage(1L, 2L, "Test message");
        });
        
        // Verify no messages were created
        verify(messageRepository, never()).save(any(MessageContent.class));
        verify(systemMessageRepository, never()).save(any(SystemMessage.class));
    }
    
    @Test
    void testSendMessage_WhenRecipientDoesNotExist_ThrowsException() {
        // Arrange
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(2L)).thenReturn(false);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            chatService.sendMessage(1L, 2L, "Test message");
        });
        
        // Verify no messages were created
        verify(messageRepository, never()).save(any(MessageContent.class));
        verify(systemMessageRepository, never()).save(any(SystemMessage.class));
    }
    
    @Test
    void testGetConversation_ReturnsConversation() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<MessageContent> messages = Arrays.asList(messageContent);
        
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.setFirstResult(anyInt())).thenReturn(query);
        when(query.setMaxResults(anyInt())).thenReturn(query);
        when(query.getResultList()).thenReturn(messages);
        when(query.getSingleResult()).thenReturn(1L);
        
        // Act
        Page<MessageContent> result = chatService.getConversation(1L, 2L, pageable);
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(messageContent, result.getContent().get(0));
    }
    
    @Test
    void testGetRecentConversations_ReturnsConversations() {
        // Arrange
        List<Long> senders = Arrays.asList(2L, 3L);
        List<Long> recipients = Arrays.asList(3L, 4L);
        
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.setMaxResults(anyInt())).thenReturn(query);
        
        // First query returns senders
        when(query.getResultList()).thenReturn(senders).thenReturn(recipients);
        
        // Act
        List<Long> result = chatService.getRecentConversations(1L);
        
        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertTrue(result.contains(2L));
        assertTrue(result.contains(3L));
        assertTrue(result.contains(4L));
    }
    
    @Test
    void testMarkConversationAsRead_MarksMessagesAsRead() {
        // Arrange
        List<Long> messageIds = Arrays.asList(1L, 2L);
        
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(messageIds);
        when(systemMessageRepository.markAsReadByIds(messageIds)).thenReturn(2);
        
        // Act
        int result = chatService.markConversationAsRead(1L, 2L);
        
        // Assert
        assertEquals(2, result);
        verify(systemMessageRepository).markAsReadByIds(messageIds);
    }
    
    @Test
    void testMarkConversationAsRead_WhenNoUnreadMessages_ReturnsZero() {
        // Arrange
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(Arrays.asList());
        
        // Act
        int result = chatService.markConversationAsRead(1L, 2L);
        
        // Assert
        assertEquals(0, result);
        verify(systemMessageRepository, never()).markAsReadByIds(anyList());
    }
    
    @Test
    void testCountUnreadMessages_ReturnsCount() {
        // Arrange
        when(entityManager.createQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(5L);
        
        // Act
        long result = chatService.countUnreadMessages(1L);
        
        // Assert
        assertEquals(5L, result);
    }
}