package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.model.entity.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.SystemMessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.impl.NotificationServiceImpl;

/**
 * Unit tests for NotificationService
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private SystemMessageRepository systemMessageRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private NotificationServiceImpl notificationService;
    
    private MessageContent messageContent;
    private SystemMessage systemMessage;
    private User user;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        messageContent = new MessageContent();
        messageContent.setId(1L);
        messageContent.setContent("Test notification");
        messageContent.setSenderId(0L);
        messageContent.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        
        systemMessage = new SystemMessage();
        systemMessage.setId(1L);
        systemMessage.setUserId(1L);
        systemMessage.setMessageId(1L);
        systemMessage.setIsRead(false);
        
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
    }
    
    @Test
    void testCreateNotification_WhenUserExists_CreatesNotification() {
        // Arrange
        when(userRepository.existsById(1L)).thenReturn(true);
        when(messageRepository.save(any(MessageContent.class))).thenReturn(messageContent);
        when(systemMessageRepository.save(any(SystemMessage.class))).thenReturn(systemMessage);
        
        // Act
        MessageContent result = notificationService.createNotification(1L, "Test notification");
        
        // Assert
        assertNotNull(result);
        assertEquals(messageContent.getId(), result.getId());
        assertEquals(messageContent.getContent(), result.getContent());
        
        // Verify message content creation
        ArgumentCaptor<MessageContent> messageCaptor = ArgumentCaptor.forClass(MessageContent.class);
        verify(messageRepository).save(messageCaptor.capture());
        assertEquals("Test notification", messageCaptor.getValue().getContent());
        assertEquals(MessageType.SYSTEM_NOTIFICATION, messageCaptor.getValue().getMessageType());
        
        // Verify system message creation
        ArgumentCaptor<SystemMessage> systemMessageCaptor = ArgumentCaptor.forClass(SystemMessage.class);
        verify(systemMessageRepository).save(systemMessageCaptor.capture());
        assertEquals(1L, systemMessageCaptor.getValue().getUserId());
        assertEquals(messageContent.getId(), systemMessageCaptor.getValue().getMessageId());
        assertFalse(systemMessageCaptor.getValue().getIsRead());
    }
    
    @Test
    void testCreateNotification_WhenUserDoesNotExist_ThrowsException() {
        // Arrange
        when(userRepository.existsById(1L)).thenReturn(false);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            notificationService.createNotification(1L, "Test notification");
        });
        
        // Verify no messages were created
        verify(messageRepository, never()).save(any(MessageContent.class));
        verify(systemMessageRepository, never()).save(any(SystemMessage.class));
    }
    
    @Test
    void testCreateNotificationForUsers_WhenUsersExist_CreatesNotifications() {
        // Arrange
        List<Long> userIds = Arrays.asList(1L, 2L, 3L);
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(2L)).thenReturn(true);
        when(userRepository.existsById(3L)).thenReturn(true);
        when(messageRepository.save(any(MessageContent.class))).thenReturn(messageContent);
        
        // Act
        MessageContent result = notificationService.createNotificationForUsers(userIds, "Test notification");
        
        // Assert
        assertNotNull(result);
        assertEquals(messageContent.getId(), result.getId());
        
        // Verify message content creation
        verify(messageRepository).save(any(MessageContent.class));
        
        // Verify system messages creation
        ArgumentCaptor<List<SystemMessage>> systemMessagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(systemMessageRepository).saveAll(systemMessagesCaptor.capture());
        List<SystemMessage> savedMessages = systemMessagesCaptor.getValue();
        assertEquals(3, savedMessages.size());
        assertEquals(1L, savedMessages.get(0).getUserId());
        assertEquals(2L, savedMessages.get(1).getUserId());
        assertEquals(3L, savedMessages.get(2).getUserId());
    }
    
    @Test
    void testCreateNotificationForUsers_WhenSomeUsersDoNotExist_CreatesNotificationsForExistingUsers() {
        // Arrange
        List<Long> userIds = Arrays.asList(1L, 2L, 3L);
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(2L)).thenReturn(false);
        when(userRepository.existsById(3L)).thenReturn(true);
        when(messageRepository.save(any(MessageContent.class))).thenReturn(messageContent);
        
        // Act
        MessageContent result = notificationService.createNotificationForUsers(userIds, "Test notification");
        
        // Assert
        assertNotNull(result);
        
        // Verify system messages creation
        ArgumentCaptor<List<SystemMessage>> systemMessagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(systemMessageRepository).saveAll(systemMessagesCaptor.capture());
        List<SystemMessage> savedMessages = systemMessagesCaptor.getValue();
        assertEquals(2, savedMessages.size());
        assertEquals(1L, savedMessages.get(0).getUserId());
        assertEquals(3L, savedMessages.get(1).getUserId());
    }
    
    @Test
    void testCreateNotificationForRole_WhenUsersWithRoleExist_CreatesNotifications() {
        // Arrange
        User user1 = new User();
        user1.setId(1L);
        User user2 = new User();
        user2.setId(2L);
        List<User> users = Arrays.asList(user1, user2);
        Page<User> userPage = new PageImpl<>(users);
        
        when(userRepository.findByRoleName(eq("ROLE_ADMIN"), any(Pageable.class))).thenReturn(userPage);
        when(userRepository.existsById(1L)).thenReturn(true);
        when(userRepository.existsById(2L)).thenReturn(true);
        when(messageRepository.save(any(MessageContent.class))).thenReturn(messageContent);
        
        // Act
        MessageContent result = notificationService.createNotificationForRole("ROLE_ADMIN", "Test notification");
        
        // Assert
        assertNotNull(result);
        
        // Verify system messages creation
        ArgumentCaptor<List<SystemMessage>> systemMessagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(systemMessageRepository).saveAll(systemMessagesCaptor.capture());
        List<SystemMessage> savedMessages = systemMessagesCaptor.getValue();
        assertEquals(2, savedMessages.size());
    }
    
    @Test
    void testCreateNotificationForRole_WhenNoUsersWithRoleExist_ThrowsException() {
        // Arrange
        Page<User> emptyPage = new PageImpl<>(Collections.emptyList());
        when(userRepository.findByRoleName(eq("ROLE_ADMIN"), any(Pageable.class))).thenReturn(emptyPage);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            notificationService.createNotificationForRole("ROLE_ADMIN", "Test notification");
        });
        
        // Verify no messages were created
        verify(messageRepository, never()).save(any(MessageContent.class));
        verify(systemMessageRepository, never()).saveAll(anyList());
    }
    
    @Test
    void testGetUserNotifications_ReturnsNotifications() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<SystemMessage> messagePage = new PageImpl<>(Collections.singletonList(systemMessage));
        when(systemMessageRepository.findByUserId(1L, pageable)).thenReturn(messagePage);
        
        // Act
        Page<SystemMessage> result = notificationService.getUserNotifications(1L, pageable);
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(systemMessage.getId(), result.getContent().get(0).getId());
    }
    
    @Test
    void testGetUnreadNotifications_ReturnsUnreadNotifications() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<SystemMessage> messagePage = new PageImpl<>(Collections.singletonList(systemMessage));
        when(systemMessageRepository.findByUserIdAndIsReadFalse(1L, pageable)).thenReturn(messagePage);
        
        // Act
        Page<SystemMessage> result = notificationService.getUnreadNotifications(1L, pageable);
        
        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(systemMessage.getId(), result.getContent().get(0).getId());
    }
    
    @Test
    void testCountUnreadNotifications_ReturnsCount() {
        // Arrange
        when(systemMessageRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(5L);
        
        // Act
        long result = notificationService.countUnreadNotifications(1L);
        
        // Assert
        assertEquals(5L, result);
    }
    
    @Test
    void testMarkAsRead_WhenMessageExistsAndBelongsToUser_MarksAsRead() {
        // Arrange
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.of(systemMessage));
        
        // Act
        boolean result = notificationService.markAsRead(1L, 1L);
        
        // Assert
        assertTrue(result);
        assertTrue(systemMessage.getIsRead());
        assertNotNull(systemMessage.getReadAt());
        verify(systemMessageRepository).save(systemMessage);
    }
    
    @Test
    void testMarkAsRead_WhenMessageDoesNotExist_ReturnsFalse() {
        // Arrange
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act
        boolean result = notificationService.markAsRead(1L, 1L);
        
        // Assert
        assertFalse(result);
        verify(systemMessageRepository, never()).save(any(SystemMessage.class));
    }
    
    @Test
    void testMarkAsRead_WhenMessageDoesNotBelongToUser_ReturnsFalse() {
        // Arrange
        systemMessage.setUserId(2L); // Different user ID
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.of(systemMessage));
        
        // Act
        boolean result = notificationService.markAsRead(1L, 1L);
        
        // Assert
        assertFalse(result);
        verify(systemMessageRepository, never()).save(any(SystemMessage.class));
    }
    
    @Test
    void testMarkAsRead_WhenMessageAlreadyRead_ReturnsFalse() {
        // Arrange
        systemMessage.setIsRead(true);
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.of(systemMessage));
        
        // Act
        boolean result = notificationService.markAsRead(1L, 1L);
        
        // Assert
        assertFalse(result);
        verify(systemMessageRepository, never()).save(any(SystemMessage.class));
    }
    
    @Test
    void testMarkMultipleAsRead_WhenMessagesExistAndBelongToUser_MarksAsRead() {
        // Arrange
        List<Long> messageIds = Arrays.asList(1L, 2L, 3L);
        
        SystemMessage message1 = new SystemMessage();
        message1.setId(1L);
        message1.setUserId(1L);
        message1.setIsRead(false);
        
        SystemMessage message2 = new SystemMessage();
        message2.setId(2L);
        message2.setUserId(1L);
        message2.setIsRead(false);
        
        SystemMessage message3 = new SystemMessage();
        message3.setId(3L);
        message3.setUserId(1L);
        message3.setIsRead(true); // Already read
        
        when(systemMessageRepository.findAllById(messageIds)).thenReturn(Arrays.asList(message1, message2, message3));
        when(systemMessageRepository.markAsReadByIds(Arrays.asList(1L, 2L))).thenReturn(2);
        
        // Act
        int result = notificationService.markMultipleAsRead(messageIds, 1L);
        
        // Assert
        assertEquals(2, result);
    }
    
    @Test
    void testMarkAllAsRead_MarksAllUnreadMessagesAsRead() {
        // Arrange
        when(systemMessageRepository.markAllAsReadForUser(1L)).thenReturn(5);
        
        // Act
        int result = notificationService.markAllAsRead(1L);
        
        // Assert
        assertEquals(5, result);
    }
    
    @Test
    void testDeleteNotification_WhenMessageExistsAndBelongsToUser_DeletesMessage() {
        // Arrange
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.of(systemMessage));
        
        // Act
        boolean result = notificationService.deleteNotification(1L, 1L);
        
        // Assert
        assertTrue(result);
        verify(systemMessageRepository).delete(systemMessage);
    }
    
    @Test
    void testDeleteNotification_WhenMessageDoesNotExist_ReturnsFalse() {
        // Arrange
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act
        boolean result = notificationService.deleteNotification(1L, 1L);
        
        // Assert
        assertFalse(result);
        verify(systemMessageRepository, never()).delete(any(SystemMessage.class));
    }
    
    @Test
    void testDeleteNotification_WhenMessageDoesNotBelongToUser_ReturnsFalse() {
        // Arrange
        systemMessage.setUserId(2L); // Different user ID
        when(systemMessageRepository.findById(1L)).thenReturn(Optional.of(systemMessage));
        
        // Act
        boolean result = notificationService.deleteNotification(1L, 1L);
        
        // Assert
        assertFalse(result);
        verify(systemMessageRepository, never()).delete(any(SystemMessage.class));
    }
}