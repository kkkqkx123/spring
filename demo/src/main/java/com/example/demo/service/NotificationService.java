package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.SystemMessage;

/**
 * Service for managing user notifications
 */
public interface NotificationService {
    
    /**
     * Create a notification for a specific user
     * 
     * @param userId the user ID
     * @param content the notification content
     * @return the created message content
     */
    MessageContent createNotification(Long userId, String content);
    
    /**
     * Create a notification for multiple users
     * 
     * @param userIds the list of user IDs
     * @param content the notification content
     * @return the created message content
     */
    MessageContent createNotificationForUsers(List<Long> userIds, String content);
    
    /**
     * Create a notification for users with a specific role
     * 
     * @param roleName the role name
     * @param content the notification content
     * @return the created message content
     */
    MessageContent createNotificationForRole(String roleName, String content);
    
    /**
     * Get notifications for a user
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return a page of system messages
     */
    Page<SystemMessage> getUserNotifications(Long userId, Pageable pageable);
    
    /**
     * Get unread notifications for a user
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return a page of unread system messages
     */
    Page<SystemMessage> getUnreadNotifications(Long userId, Pageable pageable);
    
    /**
     * Count unread notifications for a user
     * 
     * @param userId the user ID
     * @return the number of unread notifications
     */
    long countUnreadNotifications(Long userId);
    
    /**
     * Mark a notification as read
     * 
     * @param messageId the system message ID
     * @param userId the user ID
     * @return true if the notification was marked as read, false otherwise
     */
    boolean markAsRead(Long messageId, Long userId);
    
    /**
     * Mark multiple notifications as read
     * 
     * @param messageIds the list of system message IDs
     * @param userId the user ID
     * @return the number of notifications marked as read
     */
    int markMultipleAsRead(List<Long> messageIds, Long userId);
    
    /**
     * Mark all notifications as read for a user
     * 
     * @param userId the user ID
     * @return the number of notifications marked as read
     */
    int markAllAsRead(Long userId);
    
    /**
     * Delete a notification
     * 
     * @param messageId the system message ID
     * @param userId the user ID
     * @return true if the notification was deleted, false otherwise
     */
    boolean deleteNotification(Long messageId, Long userId);
    
    /**
     * Create a notification for all users
     * 
     * @param content the notification content
     * @return the created message content
     */
    MessageContent createNotificationForAllUsers(String content);
    
    /**
     * Get a notification by ID
     * 
     * @param messageId the system message ID
     * @return optional containing the system message if found
     */
    Optional<SystemMessage> getNotificationById(Long messageId);
}