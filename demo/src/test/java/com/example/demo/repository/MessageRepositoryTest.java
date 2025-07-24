package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;

/**
 * Integration tests for MessageRepository
 */
@DataJpaTest
@ActiveProfiles("test")
class MessageRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Test
    void testFindBySenderId_WhenMessagesExist_ReturnsMessages() {
        // Create and persist messages from the same sender
        MessageContent message1 = new MessageContent();
        message1.setContent("Test message 1");
        message1.setSenderId(1L);
        message1.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message1);
        
        MessageContent message2 = new MessageContent();
        message2.setContent("Test message 2");
        message2.setSenderId(1L);
        message2.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message2);
        
        // Create and persist a message from a different sender
        MessageContent message3 = new MessageContent();
        message3.setContent("Test message 3");
        message3.setSenderId(2L);
        message3.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message3);
        
        entityManager.flush();
        
        // Find messages by sender ID
        Page<MessageContent> messages = messageRepository.findBySenderId(1L, PageRequest.of(0, 10));
        
        // Verify
        assertEquals(2, messages.getTotalElements());
        assertTrue(messages.getContent().stream().anyMatch(m -> m.getContent().equals("Test message 1")));
        assertTrue(messages.getContent().stream().anyMatch(m -> m.getContent().equals("Test message 2")));
    }
    
    @Test
    void testFindByMessageType_WhenMessagesExist_ReturnsMessages() {
        // Create and persist messages of different types
        MessageContent message1 = new MessageContent();
        message1.setContent("System notification");
        message1.setSenderId(1L);
        message1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(message1);
        
        MessageContent message2 = new MessageContent();
        message2.setContent("Chat message");
        message2.setSenderId(1L);
        message2.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message2);
        
        MessageContent message3 = new MessageContent();
        message3.setContent("Announcement");
        message3.setSenderId(1L);
        message3.setMessageType(MessageType.ANNOUNCEMENT);
        entityManager.persist(message3);
        
        entityManager.flush();
        
        // Find messages by message type
        Page<MessageContent> notifications = messageRepository.findByMessageType(MessageType.SYSTEM_NOTIFICATION, PageRequest.of(0, 10));
        Page<MessageContent> chatMessages = messageRepository.findByMessageType(MessageType.CHAT_MESSAGE, PageRequest.of(0, 10));
        Page<MessageContent> announcements = messageRepository.findByMessageType(MessageType.ANNOUNCEMENT, PageRequest.of(0, 10));
        
        // Verify
        assertEquals(1, notifications.getTotalElements());
        assertEquals("System notification", notifications.getContent().get(0).getContent());
        
        assertEquals(1, chatMessages.getTotalElements());
        assertEquals("Chat message", chatMessages.getContent().get(0).getContent());
        
        assertEquals(1, announcements.getTotalElements());
        assertEquals("Announcement", announcements.getContent().get(0).getContent());
    }
    
    @Test
    void testFindBySenderIdAndMessageType_WhenMessagesExist_ReturnsMessages() {
        // Create and persist messages from the same sender with different types
        MessageContent message1 = new MessageContent();
        message1.setContent("System notification");
        message1.setSenderId(1L);
        message1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(message1);
        
        MessageContent message2 = new MessageContent();
        message2.setContent("Chat message");
        message2.setSenderId(1L);
        message2.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message2);
        
        // Create and persist a message from a different sender
        MessageContent message3 = new MessageContent();
        message3.setContent("Another chat message");
        message3.setSenderId(2L);
        message3.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message3);
        
        entityManager.flush();
        
        // Find messages by sender ID and message type
        Page<MessageContent> messages = messageRepository.findBySenderIdAndMessageType(1L, MessageType.CHAT_MESSAGE, PageRequest.of(0, 10));
        
        // Verify
        assertEquals(1, messages.getTotalElements());
        assertEquals("Chat message", messages.getContent().get(0).getContent());
    }
    
    @Test
    void testSearchByContent_WhenMessagesMatch_ReturnsMessages() {
        // Create and persist messages with different content
        MessageContent message1 = new MessageContent();
        message1.setContent("Important system notification");
        message1.setSenderId(1L);
        message1.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        entityManager.persist(message1);
        
        MessageContent message2 = new MessageContent();
        message2.setContent("Regular chat message");
        message2.setSenderId(1L);
        message2.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message2);
        
        MessageContent message3 = new MessageContent();
        message3.setContent("Important announcement");
        message3.setSenderId(2L);
        message3.setMessageType(MessageType.ANNOUNCEMENT);
        entityManager.persist(message3);
        
        entityManager.flush();
        
        // Search messages by content
        Page<MessageContent> importantMessages = messageRepository.searchByContent("important", PageRequest.of(0, 10));
        
        // Verify
        assertEquals(2, importantMessages.getTotalElements());
        assertTrue(importantMessages.getContent().stream().anyMatch(m -> m.getContent().equals("Important system notification")));
        assertTrue(importantMessages.getContent().stream().anyMatch(m -> m.getContent().equals("Important announcement")));
    }
    
    @Test
    void testFindRecentByType_WhenMessagesExist_ReturnsMessages() {
        // Create and persist messages of the same type
        MessageContent message1 = new MessageContent();
        message1.setContent("Announcement 1");
        message1.setSenderId(1L);
        message1.setMessageType(MessageType.ANNOUNCEMENT);
        entityManager.persist(message1);
        
        MessageContent message2 = new MessageContent();
        message2.setContent("Announcement 2");
        message2.setSenderId(1L);
        message2.setMessageType(MessageType.ANNOUNCEMENT);
        entityManager.persist(message2);
        
        MessageContent message3 = new MessageContent();
        message3.setContent("Chat message");
        message3.setSenderId(2L);
        message3.setMessageType(MessageType.CHAT_MESSAGE);
        entityManager.persist(message3);
        
        entityManager.flush();
        
        // Find recent messages by type
        Pageable limit = PageRequest.of(0, 2);
        List<MessageContent> announcements = messageRepository.findRecentByType(MessageType.ANNOUNCEMENT, limit);
        
        // Verify
        assertEquals(2, announcements.size());
        assertTrue(announcements.stream().allMatch(m -> m.getMessageType() == MessageType.ANNOUNCEMENT));
    }
    
    @Test
    void testStaticFactoryMethods_CreatesCorrectMessageTypes() {
        // Create messages using static factory methods
        MessageContent notification = MessageContent.createSystemNotification("System notification", 1L);
        MessageContent chatMessage = MessageContent.createChatMessage("Chat message", 2L);
        MessageContent announcement = MessageContent.createAnnouncement("Announcement", 3L);
        
        // Verify
        assertEquals(MessageType.SYSTEM_NOTIFICATION, notification.getMessageType());
        assertEquals("System notification", notification.getContent());
        assertEquals(1L, notification.getSenderId());
        
        assertEquals(MessageType.CHAT_MESSAGE, chatMessage.getMessageType());
        assertEquals("Chat message", chatMessage.getContent());
        assertEquals(2L, chatMessage.getSenderId());
        
        assertEquals(MessageType.ANNOUNCEMENT, announcement.getMessageType());
        assertEquals("Announcement", announcement.getContent());
        assertEquals(3L, announcement.getSenderId());
    }
}