package com.example.demo.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.model.entity.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.SystemMessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.NotificationService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of NotificationService
 */
@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    
    private final MessageRepository messageRepository;
    private final SystemMessageRepository systemMessageRepository;
    private final UserRepository userRepository;
    
    public NotificationServiceImpl(
            MessageRepository messageRepository,
            SystemMessageRepository systemMessageRepository,
            UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.systemMessageRepository = systemMessageRepository;
        this.userRepository = userRepository;
    }
    
    @Override
    @Transactional
    public MessageContent createNotification(Long userId, String content) {
        log.debug("Creating notification for user ID: {}", userId);
        
        // Check if user exists
        if (!userRepository.existsById(userId)) {
            log.warn("User with ID {} not found", userId);
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }
        
        // Create message content
        MessageContent messageContent = MessageContent.createSystemNotification(content, 0L); // 0L represents system
        messageContent = messageRepository.save(messageContent);
        
        // Create system message for the user
        SystemMessage systemMessage = SystemMessage.create(userId, messageContent.getId());
        systemMessageRepository.save(systemMessage);
        
        log.info("Notification created for user ID: {}, message ID: {}", userId, messageContent.getId());
        return messageContent;
    }
    
    @Override
    @Transactional
    public MessageContent createNotificationForUsers(List<Long> userIds, String content) {
        log.debug("Creating notification for {} users", userIds.size());
        
        // Create message content
        MessageContent messageContent = MessageContent.createSystemNotification(content, 0L); // 0L represents system
        messageContent = messageRepository.save(messageContent);
        
        // Create system messages for each user
        List<SystemMessage> systemMessages = new ArrayList<>();
        for (Long userId : userIds) {
            if (userRepository.existsById(userId)) {
                SystemMessage systemMessage = SystemMessage.create(userId, messageContent.getId());
                systemMessages.add(systemMessage);
            } else {
                log.warn("User with ID {} not found, skipping notification", userId);
            }
        }
        
        if (!systemMessages.isEmpty()) {
            systemMessageRepository.saveAll(systemMessages);
            log.info("Notification created for {} users, message ID: {}", systemMessages.size(), messageContent.getId());
        } else {
            log.warn("No valid users found for notification");
        }
        
        return messageContent;
    }
    
    @Override
    @Transactional
    public MessageContent createNotificationForRole(String roleName, String content) {
        log.debug("Creating notification for users with role: {}", roleName);
        
        // Find users with the specified role
        Page<User> users = userRepository.findByRoleName(roleName, Pageable.unpaged());
        List<Long> userIds = users.getContent().stream()
                .map(User::getId)
                .collect(Collectors.toList());
        
        if (userIds.isEmpty()) {
            log.warn("No users found with role: {}", roleName);
            throw new IllegalArgumentException("No users found with role: " + roleName);
        }
        
        // Create notification for the users
        return createNotificationForUsers(userIds, content);
    }
    
    @Override
    public Page<SystemMessage> getUserNotifications(Long userId, Pageable pageable) {
        log.debug("Getting notifications for user ID: {}", userId);
        return systemMessageRepository.findWithContentByUserId(userId, pageable);
    }
    
    @Override
    public Page<SystemMessage> getUnreadNotifications(Long userId, Pageable pageable) {
        log.debug("Getting unread notifications for user ID: {}", userId);
        return systemMessageRepository.findWithContentByUserIdAndIsReadFalse(userId, pageable);
    }
    
    @Override
    public long countUnreadNotifications(Long userId) {
        log.debug("Counting unread notifications for user ID: {}", userId);
        return systemMessageRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    @Override
    @Transactional
    public boolean markAsRead(Long messageId, Long userId) {
        log.debug("Marking notification as read: messageId={}, userId={}", messageId, userId);
        
        Optional<SystemMessage> systemMessageOpt = systemMessageRepository.findById(messageId);
        if (systemMessageOpt.isPresent()) {
            SystemMessage systemMessage = systemMessageOpt.get();
            
            // Verify the message belongs to the user
            if (!systemMessage.getUserId().equals(userId)) {
                log.warn("User ID {} attempted to mark message ID {} as read, but it belongs to user ID {}", 
                        userId, messageId, systemMessage.getUserId());
                return false;
            }
            
            // Mark as read if not already read
            if (!systemMessage.getIsRead()) {
                systemMessage.markAsRead();
                systemMessageRepository.save(systemMessage);
                log.info("Notification marked as read: messageId={}, userId={}", messageId, userId);
                return true;
            } else {
                log.debug("Notification already marked as read: messageId={}, userId={}", messageId, userId);
                return false;
            }
        } else {
            log.warn("Notification not found: messageId={}", messageId);
            return false;
        }
    }
    
    @Override
    @Transactional
    public int markMultipleAsRead(List<Long> messageIds, Long userId) {
        log.debug("Marking multiple notifications as read: count={}, userId={}", messageIds.size(), userId);
        
        // Verify all messages belong to the user
        List<SystemMessage> userMessages = systemMessageRepository.findAllById(messageIds).stream()
                .filter(message -> message.getUserId().equals(userId))
                .collect(Collectors.toList());
        
        if (userMessages.isEmpty()) {
            log.warn("No valid messages found for user ID: {}", userId);
            return 0;
        }
        
        // Get IDs of unread messages
        List<Long> unreadMessageIds = userMessages.stream()
                .filter(message -> !message.getIsRead())
                .map(SystemMessage::getId)
                .collect(Collectors.toList());
        
        if (unreadMessageIds.isEmpty()) {
            log.debug("No unread messages found for user ID: {}", userId);
            return 0;
        }
        
        // Mark messages as read
        int updated = systemMessageRepository.markAsReadByIds(unreadMessageIds);
        log.info("{} notifications marked as read for user ID: {}", updated, userId);
        return updated;
    }
    
    @Override
    @Transactional
    public int markAllAsRead(Long userId) {
        log.debug("Marking all notifications as read for user ID: {}", userId);
        int updated = systemMessageRepository.markAllAsReadForUser(userId);
        log.info("{} notifications marked as read for user ID: {}", updated, userId);
        return updated;
    }
    
    @Override
    @Transactional
    public boolean deleteNotification(Long messageId, Long userId) {
        log.debug("Deleting notification: messageId={}, userId={}", messageId, userId);
        
        Optional<SystemMessage> systemMessageOpt = systemMessageRepository.findById(messageId);
        if (systemMessageOpt.isPresent()) {
            SystemMessage systemMessage = systemMessageOpt.get();
            
            // Verify the message belongs to the user
            if (!systemMessage.getUserId().equals(userId)) {
                log.warn("User ID {} attempted to delete message ID {}, but it belongs to user ID {}", 
                        userId, messageId, systemMessage.getUserId());
                return false;
            }
            
            // Delete the system message
            systemMessageRepository.delete(systemMessage);
            log.info("Notification deleted: messageId={}, userId={}", messageId, userId);
            return true;
        } else {
            log.warn("Notification not found: messageId={}", messageId);
            return false;
        }
    }
    
    @Override
    public Optional<SystemMessage> getNotificationById(Long messageId) {
        log.debug("Getting notification by ID: {}", messageId);
        return systemMessageRepository.findById(messageId);
    }
    
    @Override
    @Transactional
    public MessageContent createNotificationForAllUsers(String content) {
        log.debug("Creating broadcast notification for all users");
        
        // Create message content
        MessageContent messageContent = MessageContent.createSystemNotification(content, 0L); // 0L represents system
        messageContent.setMessageType(MessageContent.MessageType.BROADCAST);
        MessageContent savedMessageContent = messageRepository.save(messageContent);
        
        // Get all user IDs
        List<Long> allUserIds = userRepository.findAll().stream()
                .map(User::getId)
                .collect(Collectors.toList());
        
        if (allUserIds.isEmpty()) {
            log.warn("No users found for broadcast notification");
            return savedMessageContent;
        }
        
        // Create system messages for each user
        List<SystemMessage> systemMessages = allUserIds.stream()
                .map(userId -> SystemMessage.create(userId, savedMessageContent.getId()))
                .collect(Collectors.toList());
        
        systemMessageRepository.saveAll(systemMessages);
        log.info("Broadcast notification created for {} users, message ID: {}", 
                systemMessages.size(), savedMessageContent.getId());
        
        return savedMessageContent;
    }
}