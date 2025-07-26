package com.example.demo.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.SystemMessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ChatService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of ChatService
 */
@Service
@Slf4j
public class ChatServiceImpl implements ChatService {
    
    private final MessageRepository messageRepository;
    private final SystemMessageRepository systemMessageRepository;
    private final UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public ChatServiceImpl(
            MessageRepository messageRepository,
            SystemMessageRepository systemMessageRepository,
            UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.systemMessageRepository = systemMessageRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    @Transactional
    public MessageContent sendMessage(Long senderId, Long recipientId, String content) {
        log.debug("Sending message from user ID: {} to user ID: {}", senderId, recipientId);
        
        // Check if users exist
        if (!userRepository.existsById(senderId)) {
            log.warn("Sender with ID {} not found", senderId);
            throw new IllegalArgumentException("Sender not found with ID: " + senderId);
        }
        
        if (!userRepository.existsById(recipientId)) {
            log.warn("Recipient with ID {} not found", recipientId);
            throw new IllegalArgumentException("Recipient not found with ID: " + recipientId);
        }
        
        // Create message content
        MessageContent messageContent = MessageContent.createChatMessage(content, senderId);
        messageContent = messageRepository.save(messageContent);
        
        // Create system message for the recipient
        SystemMessage systemMessage = SystemMessage.create(recipientId, messageContent.getId());
        systemMessageRepository.save(systemMessage);
        
        log.info("Message sent from user ID: {} to user ID: {}, message ID: {}", 
                senderId, recipientId, messageContent.getId());
        return messageContent;
    }
    
    @Override
    public Page<MessageContent> getConversation(Long userId1, Long userId2, Pageable pageable) {
        log.debug("Getting conversation between user ID: {} and user ID: {}", userId1, userId2);
        
        // Custom query to get messages between two users
        String jpql = "SELECT m FROM MessageContent m WHERE " +
                      "(m.senderId = :userId1 AND m.messageType = :messageType AND " +
                      "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId2)) OR " +
                      "(m.senderId = :userId2 AND m.messageType = :messageType AND " +
                      "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId1)) " +
                      "ORDER BY m.createdAt DESC";
        
        TypedQuery<MessageContent> query = entityManager.createQuery(jpql, MessageContent.class)
                .setParameter("userId1", userId1)
                .setParameter("userId2", userId2)
                .setParameter("messageType", MessageType.CHAT_MESSAGE)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());
        
        List<MessageContent> messages = query.getResultList();
        
        // Count total elements
        String countJpql = "SELECT COUNT(m) FROM MessageContent m WHERE " +
                           "(m.senderId = :userId1 AND m.messageType = :messageType AND " +
                           "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId2)) OR " +
                           "(m.senderId = :userId2 AND m.messageType = :messageType AND " +
                           "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId1))";
        
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class)
                .setParameter("userId1", userId1)
                .setParameter("userId2", userId2)
                .setParameter("messageType", MessageType.CHAT_MESSAGE);
        
        long total = countQuery.getSingleResult();
        
        return new org.springframework.data.domain.PageImpl<>(messages, pageable, total);
    }
    
    @Override
    public List<Long> getRecentConversations(Long userId) {
        log.debug("Getting recent conversations for user ID: {}", userId);
        
        // Get users who have sent messages to this user
        String senderJpql = "SELECT DISTINCT m.senderId FROM MessageContent m " +
                           "JOIN SystemMessage sm ON sm.messageId = m.id " +
                           "WHERE sm.userId = :userId AND m.messageType = :messageType " +
                           "ORDER BY MAX(m.createdAt) DESC";
        
        TypedQuery <Long> senderQuery = entityManager.createQuery(senderJpql,Long.class)
                .setParameter("userId", userId)
                .setParameter("messageType", MessageType.CHAT_MESSAGE)
                .setMaxResults(10);
        
        List<Long> senders = senderQuery.getResultList();
        
        // Get users to whom this user has sent messages
        String recipientJpql = "SELECT DISTINCT sm.userId FROM MessageContent m " +
                              "JOIN SystemMessage sm ON sm.messageId = m.id " +
                              "WHERE m.senderId = :userId AND m.messageType = :messageType " +
                              "ORDER BY MAX(m.createdAt) DESC";
        
        TypedQuery <Long> recipientQuery = entityManager.createQuery(recipientJpql, Long.class)
                .setParameter("userId", userId)
                .setParameter("messageType", MessageType.CHAT_MESSAGE)
                .setMaxResults(10);
        
        List<Long> recipients = recipientQuery.getResultList();
        
        // Combine and remove duplicates
        List<Long> conversations = new ArrayList<>();
        conversations.addAll(senders);
        
        for (Long recipientId : recipients) {
            if (!conversations.contains(recipientId)) {
                conversations.add(recipientId);
            }
        }
        
        // Limit to 10 conversations
        if (conversations.size() > 10) {
            conversations = conversations.subList(0, 10);
        }
        
        return conversations;
    }
    
    @Override
    @Transactional
    public int markConversationAsRead(Long recipientId, Long senderId) {
        log.debug("Marking conversation as read for recipient ID: {} from sender ID: {}", recipientId, senderId);
        
        // Find message IDs from sender to recipient
        String jpql = "SELECT sm.id FROM SystemMessage sm " +
                      "JOIN MessageContent m ON sm.messageId = m.id " +
                      "WHERE sm.userId = :recipientId AND m.senderId = :senderId " +
                      "AND sm.isRead = false";
        
        TypedQuery <Long> query = entityManager.createQuery(jpql,Long.class)
                .setParameter("recipientId", recipientId)
                .setParameter("senderId", senderId);
        
        List<Long> messageIds = query.getResultList();
        
        if (messageIds.isEmpty()) {
            log.debug("No unread messages found");
            return 0;
        }
        
        // Mark messages as read
        int updated = systemMessageRepository.markAsReadByIds(messageIds);
        log.info("{} messages marked as read for recipient ID: {} from sender ID: {}", 
                updated, recipientId, senderId);
        return updated;
    }
    
    @Override
    public long countUnreadMessages(Long userId) {
        log.debug("Counting unread messages for user ID: {}", userId);
        
        String jpql = "SELECT COUNT(sm) FROM SystemMessage sm " +
                      "JOIN MessageContent m ON sm.messageId = m.id " +
                      "WHERE sm.userId = :userId AND m.messageType = :messageType " +
                      "AND sm.isRead = false";
        
        Query query = entityManager.createQuery(jpql)
                .setParameter("userId", userId)
                .setParameter("messageType", MessageType.CHAT_MESSAGE);
        
        return (long) query.getSingleResult();
    }
    
    @Override
    public Page<MessageContent> getAllMessages(Long userId, Pageable pageable) {
        log.debug("Getting all messages for user ID: {}", userId);
        
        // Get messages where user is sender or recipient
        String jpql = "SELECT m FROM MessageContent m WHERE " +
                      "m.senderId = :userId OR " +
                      "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId) " +
                      "ORDER BY m.createdAt DESC";
        
        TypedQuery<MessageContent> query = entityManager.createQuery(jpql, MessageContent.class)
                .setParameter("userId", userId)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());
        
        List<MessageContent> messages = query.getResultList();
        
        // Count total elements
        String countJpql = "SELECT COUNT(m) FROM MessageContent m WHERE " +
                           "m.senderId = :userId OR " +
                           "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId)";
        
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class)
                .setParameter("userId", userId);
        
        long total = countQuery.getSingleResult();
        
        return new org.springframework.data.domain.PageImpl<>(messages, pageable, total);
    }
    
    @Override
    @Transactional
    public MessageContent saveMessage(MessageContent messageContent) {
        log.debug("Saving message content: {}", messageContent.getContent());
        return messageRepository.save(messageContent);
    }
    
    @Override
    public MessageContent getMessageById(Long id) {
        log.debug("Getting message by ID: {}", id);
        return messageRepository.findById(id).orElse(null);
    }
    
    @Override
    @Transactional
    public MessageContent updateMessage(MessageContent messageContent) {
        log.debug("Updating message ID: {}", messageContent.getId());
        return messageRepository.save(messageContent);
    }
    
    @Override
    @Transactional
    public void deleteMessage(Long id) {
        log.debug("Deleting message ID: {}", id);
        messageRepository.deleteById(id);
    }
    
    @Override
    public List<MessageContent> getRecentMessages(Long userId, int limit) {
        log.debug("Getting recent messages for user ID: {}, limit: {}", userId, limit);
        
        String jpql = "SELECT m FROM MessageContent m WHERE " +
                      "m.senderId = :userId OR " +
                      "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId) " +
                      "ORDER BY m.createdAt DESC";
        
        TypedQuery<MessageContent> query = entityManager.createQuery(jpql, MessageContent.class)
                .setParameter("userId", userId)
                .setMaxResults(limit);
        
        return query.getResultList();
    }
    
    @Override
    public Page<MessageContent> searchMessages(Long userId, String query, Pageable pageable) {
        log.debug("Searching messages for user ID: {}, query: {}", userId, query);
        
        String jpql = "SELECT m FROM MessageContent m WHERE " +
                      "(m.senderId = :userId OR " +
                      "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId)) " +
                      "AND LOWER(m.content) LIKE LOWER(:query) " +
                      "ORDER BY m.createdAt DESC";
        
        TypedQuery<MessageContent> searchQuery = entityManager.createQuery(jpql, MessageContent.class)
                .setParameter("userId", userId)
                .setParameter("query", "%" + query + "%")
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());
        
        List<MessageContent> messages = searchQuery.getResultList();
        
        // Count total elements
        String countJpql = "SELECT COUNT(m) FROM MessageContent m WHERE " +
                           "(m.senderId = :userId OR " +
                           "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId)) " +
                           "AND LOWER(m.content) LIKE LOWER(:query)";
        
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class)
                .setParameter("userId", userId)
                .setParameter("query", "%" + query + "%");
        
        long total = countQuery.getSingleResult();
        
        return new org.springframework.data.domain.PageImpl<>(messages, pageable, total);
    }
    
    @Override
    public Page<MessageContent> getMessagesByDateRange(Long userId, java.time.LocalDateTime startDate, 
                                                       java.time.LocalDateTime endDate, Pageable pageable) {
        log.debug("Getting messages by date range for user ID: {}, start: {}, end: {}", userId, startDate, endDate);
        
        String jpql = "SELECT m FROM MessageContent m WHERE " +
                      "(m.senderId = :userId OR " +
                      "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId)) " +
                      "AND m.createdAt >= :startDate AND m.createdAt <= :endDate " +
                      "ORDER BY m.createdAt DESC";
        
        TypedQuery<MessageContent> query = entityManager.createQuery(jpql, MessageContent.class)
                .setParameter("userId", userId)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize());
        
        List<MessageContent> messages = query.getResultList();
        
        // Count total elements
        String countJpql = "SELECT COUNT(m) FROM MessageContent m WHERE " +
                           "(m.senderId = :userId OR " +
                           "EXISTS (SELECT sm FROM SystemMessage sm WHERE sm.messageId = m.id AND sm.userId = :userId)) " +
                           "AND m.createdAt >= :startDate AND m.createdAt <= :endDate";
        
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class)
                .setParameter("userId", userId)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate);
        
        long total = countQuery.getSingleResult();
        
        return new org.springframework.data.domain.PageImpl<>(messages, pageable, total);
    }
}