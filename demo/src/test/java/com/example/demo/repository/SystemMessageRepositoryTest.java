package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;
import com.example.demo.model.entity.SystemMessage;

/**
 * Integration tests for SystemMessageRepository
 */
@DataJpaTest
@ActiveProfiles("test")
class SystemMessageRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private SystemMessageRepository systemMessageRepository;
    
    @Test
    void testFindByUserId_WhenMessagesExist_ReturnsMessages() {
        // Create and persist messages
        MessageContent messageContent1 = new MessageContent();
        messageContent1.setContent("Test message 1");
        messageContent1.setSenderId(1L);
        messageContent1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent1);
        
        MessageContent messageContent2 = new MessageContent();
        messageContent2.setContent("Test message 2");
        messageContent2.setSenderId(1L);
        messageContent2.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent2);
        
        // Create and persist system messages for a user
        SystemMessage systemMessage1 = new SystemMessage();
        systemMessage1.setUserId(1L);
        systemMessage1.setMessageId(messageContent1.getId());
        systemMessage1.setIsRead(false);
        entityManager.persist(systemMessage1);
        
        SystemMessage systemMessage2 = new SystemMessage();
        systemMessage2.setUserId(1L);
        systemMessage2.setMessageId(messageContent2.getId());
        systemMessage2.setIsRead(true);
        systemMessage2.setReadAt(LocalDateTime.now());
        entityManager.persist(systemMessage2);
        
        // Create and persist a system message for another user
        SystemMessage systemMessage3 = new SystemMessage();
        systemMessage3.setUserId(2L);
        systemMessage3.setMessageId(messageContent1.getId());
        systemMessage3.setIsRead(false);
        entityManager.persist(systemMessage3);
        
        entityManager.flush();
        
        // Find system messages by user ID
        Page<SystemMessage> messages = systemMessageRepository.findByUserId(1L, PageRequest.of(0, 10));
        
        // Verify
        assertEquals(2, messages.getTotalElements());
    }
    
    @Test
    void testFindByUserIdAndIsReadFalse_WhenUnreadMessagesExist_ReturnsUnreadMessages() {
        // Create and persist messages
        MessageContent messageContent1 = new MessageContent();
        messageContent1.setContent("Test message 1");
        messageContent1.setSenderId(1L);
        messageContent1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent1);
        
        MessageContent messageContent2 = new MessageContent();
        messageContent2.setContent("Test message 2");
        messageContent2.setSenderId(1L);
        messageContent2.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent2);
        
        // Create and persist system messages for a user
        SystemMessage systemMessage1 = new SystemMessage();
        systemMessage1.setUserId(1L);
        systemMessage1.setMessageId(messageContent1.getId());
        systemMessage1.setIsRead(false);
        entityManager.persist(systemMessage1);
        
        SystemMessage systemMessage2 = new SystemMessage();
        systemMessage2.setUserId(1L);
        systemMessage2.setMessageId(messageContent2.getId());
        systemMessage2.setIsRead(true);
        systemMessage2.setReadAt(LocalDateTime.now());
        entityManager.persist(systemMessage2);
        
        entityManager.flush();
        
        // Find unread system messages by user ID
        Page<SystemMessage> unreadMessages = systemMessageRepository.findByUserIdAndIsReadFalse(1L, PageRequest.of(0, 10));
        
        // Verify
        assertEquals(1, unreadMessages.getTotalElements());
        assertFalse(unreadMessages.getContent().get(0).getIsRead());
    }
    
    @Test
    void testFindByUserIdAndMessageId_WhenMessageExists_ReturnsMessage() {
        // Create and persist a message
        MessageContent messageContent = new MessageContent();
        messageContent.setContent("Test message");
        messageContent.setSenderId(1L);
        messageContent.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent);
        
        // Create and persist a system message
        SystemMessage systemMessage = new SystemMessage();
        systemMessage.setUserId(1L);
        systemMessage.setMessageId(messageContent.getId());
        systemMessage.setIsRead(false);
        entityManager.persist(systemMessage);
        
        entityManager.flush();
        
        // Find system message by user ID and message ID
        Optional<SystemMessage> found = systemMessageRepository.findByUserIdAndMessageId(1L, messageContent.getId());
        
        // Verify
        assertTrue(found.isPresent());
        assertEquals(1L, found.get().getUserId());
        assertEquals(messageContent.getId(), found.get().getMessageId());
    }
    
    @Test
    void testCountByUserIdAndIsReadFalse_WhenUnreadMessagesExist_ReturnsCount() {
        // Create and persist messages
        MessageContent messageContent1 = new MessageContent();
        messageContent1.setContent("Test message 1");
        messageContent1.setSenderId(1L);
        messageContent1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent1);
        
        MessageContent messageContent2 = new MessageContent();
        messageContent2.setContent("Test message 2");
        messageContent2.setSenderId(1L);
        messageContent2.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent2);
        
        // Create and persist system messages for a user
        SystemMessage systemMessage1 = new SystemMessage();
        systemMessage1.setUserId(1L);
        systemMessage1.setMessageId(messageContent1.getId());
        systemMessage1.setIsRead(false);
        entityManager.persist(systemMessage1);
        
        SystemMessage systemMessage2 = new SystemMessage();
        systemMessage2.setUserId(1L);
        systemMessage2.setMessageId(messageContent2.getId());
        systemMessage2.setIsRead(false);
        entityManager.persist(systemMessage2);
        
        SystemMessage systemMessage3 = new SystemMessage();
        systemMessage3.setUserId(1L);
        systemMessage3.setMessageId(messageContent2.getId());
        systemMessage3.setIsRead(true);
        systemMessage3.setReadAt(LocalDateTime.now());
        entityManager.persist(systemMessage3);
        
        entityManager.flush();
        
        // Count unread system messages by user ID
        long count = systemMessageRepository.countByUserIdAndIsReadFalse(1L);
        
        // Verify
        assertEquals(2, count);
    }
    
    @Test
    @Transactional
    void testMarkAsReadByIds_WhenUnreadMessagesExist_MarksMessagesAsRead() {
        // Create and persist messages
        MessageContent messageContent1 = new MessageContent();
        messageContent1.setContent("Test message 1");
        messageContent1.setSenderId(1L);
        messageContent1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent1);
        
        MessageContent messageContent2 = new MessageContent();
        messageContent2.setContent("Test message 2");
        messageContent2.setSenderId(1L);
        messageContent2.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent2);
        
        // Create and persist system messages
        SystemMessage systemMessage1 = new SystemMessage();
        systemMessage1.setUserId(1L);
        systemMessage1.setMessageId(messageContent1.getId());
        systemMessage1.setIsRead(false);
        entityManager.persist(systemMessage1);
        
        SystemMessage systemMessage2 = new SystemMessage();
        systemMessage2.setUserId(1L);
        systemMessage2.setMessageId(messageContent2.getId());
        systemMessage2.setIsRead(false);
        entityManager.persist(systemMessage2);
        
        entityManager.flush();
        
        // Mark messages as read
        int updated = systemMessageRepository.markAsReadByIds(Arrays.asList(systemMessage1.getId(), systemMessage2.getId()));
        
        // Verify
        assertEquals(2, updated);
        
        // Refresh entities from database
        SystemMessage refreshedMessage1 = entityManager.find(SystemMessage.class, systemMessage1.getId());
        SystemMessage refreshedMessage2 = entityManager.find(SystemMessage.class, systemMessage2.getId());
        
        assertTrue(refreshedMessage1.getIsRead());
        assertNotNull(refreshedMessage1.getReadAt());
        
        assertTrue(refreshedMessage2.getIsRead());
        assertNotNull(refreshedMessage2.getReadAt());
    }
    
    @Test
    @Transactional
    void testMarkAllAsReadForUser_WhenUnreadMessagesExist_MarksAllMessagesAsRead() {
        // Create and persist messages
        MessageContent messageContent1 = new MessageContent();
        messageContent1.setContent("Test message 1");
        messageContent1.setSenderId(1L);
        messageContent1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent1);
        
        MessageContent messageContent2 = new MessageContent();
        messageContent2.setContent("Test message 2");
        messageContent2.setSenderId(1L);
        messageContent2.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(messageContent2);
        
        // Create and persist system messages for a user
        SystemMessage systemMessage1 = new SystemMessage();
        systemMessage1.setUserId(1L);
        systemMessage1.setMessageId(messageContent1.getId());
        systemMessage1.setIsRead(false);
        entityManager.persist(systemMessage1);
        
        SystemMessage systemMessage2 = new SystemMessage();
        systemMessage2.setUserId(1L);
        systemMessage2.setMessageId(messageContent2.getId());
        systemMessage2.setIsRead(false);
        entityManager.persist(systemMessage2);
        
        // Create and persist a system message for another user
        SystemMessage systemMessage3 = new SystemMessage();
        systemMessage3.setUserId(2L);
        systemMessage3.setMessageId(messageContent1.getId());
        systemMessage3.setIsRead(false);
        entityManager.persist(systemMessage3);
        
        entityManager.flush();
        
        // Mark all messages as read for user
        int updated = systemMessageRepository.markAllAsReadForUser(1L);
        
        // Verify
        assertEquals(2, updated);
        
        // Refresh entities from database
        SystemMessage refreshedMessage1 = entityManager.find(SystemMessage.class, systemMessage1.getId());
        SystemMessage refreshedMessage2 = entityManager.find(SystemMessage.class, systemMessage2.getId());
        SystemMessage refreshedMessage3 = entityManager.find(SystemMessage.class, systemMessage3.getId());
        
        assertTrue(refreshedMessage1.getIsRead());
        assertNotNull(refreshedMessage1.getReadAt());
        
        assertTrue(refreshedMessage2.getIsRead());
        assertNotNull(refreshedMessage2.getReadAt());
        
        // Message for other user should still be unread
        assertFalse(refreshedMessage3.getIsRead());
        assertNull(refreshedMessage3.getReadAt());
    }
    
    @Test
    void testSystemMessageCreate_CreatesCorrectSystemMessage() {
        // Create a system message using static factory method
        SystemMessage systemMessage = SystemMessage.create(1L, 2L);
        
        // Verify
        assertEquals(1L, systemMessage.getUserId());
        assertEquals(2L, systemMessage.getMessageId());
        assertFalse(systemMessage.getIsRead());
        assertNull(systemMessage.getReadAt());
    }
    
    @Test
    void testMarkAsRead_MarksMessageAsRead() {
        // Create a system message
        SystemMessage systemMessage = new SystemMessage();
        systemMessage.setUserId(1L);
        systemMessage.setMessageId(2L);
        systemMessage.setIsRead(false);
        
        // Mark as read
        systemMessage.markAsRead();
        
        // Verify
        assertTrue(systemMessage.getIsRead());
        assertNotNull(systemMessage.getReadAt());
    }
}