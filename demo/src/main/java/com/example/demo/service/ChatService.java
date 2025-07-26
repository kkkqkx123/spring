package com.example.demo.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.model.entity.MessageContent;

/**
 * Service for chat functionality
 */
public interface ChatService {
    
    /**
     * Send a chat message from one user to another
     * 
     * @param senderId the sender ID
     * @param recipientId the recipient ID
     * @param content the message content
     * @return the created message content
     */
    MessageContent sendMessage(Long senderId, Long recipientId, String content);
    
    /**
     * Get chat messages between two users
     * 
     * @param userId1 the first user ID
     * @param userId2 the second user ID
     * @param pageable pagination information
     * @return a page of message contents
     */
    Page<MessageContent> getConversation(Long userId1, Long userId2, Pageable pageable);
    
    /**
     * Get recent conversations for a user
     * 
     * @param userId the user ID
     * @return a list of user IDs that the user has chatted with recently
     */
    List<Long> getRecentConversations(Long userId);
    
    /**
     * Mark messages as read
     * 
     * @param recipientId the recipient ID
     * @param senderId the sender ID
     * @return the number of messages marked as read
     */
    int markConversationAsRead(Long recipientId, Long senderId);
    
    /**
     * Count unread messages for a user
     * 
     * @param userId the user ID
     * @return the number of unread messages
     */
    long countUnreadMessages(Long userId);
    
    /**
     * Get all messages for a user (paginated)
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return a page of message contents
     */
    Page<MessageContent> getAllMessages(Long userId, Pageable pageable);
    
    /**
     * Save a message
     * 
     * @param messageContent the message content to save
     * @return the saved message content
     */
    MessageContent saveMessage(MessageContent messageContent);
    
    /**
     * Get a message by ID
     * 
     * @param id the message ID
     * @return the message content or null if not found
     */
    MessageContent getMessageById(Long id);
    
    /**
     * Update a message
     * 
     * @param messageContent the message content to update
     * @return the updated message content
     */
    MessageContent updateMessage(MessageContent messageContent);
    
    /**
     * Delete a message by ID
     * 
     * @param id the message ID
     */
    void deleteMessage(Long id);
    
    /**
     * Get recent messages for a user
     * 
     * @param userId the user ID
     * @param limit the maximum number of messages to return
     * @return a list of recent message contents
     */
    List<MessageContent> getRecentMessages(Long userId, int limit);
    
    /**
     * Search messages by content
     * 
     * @param userId the user ID
     * @param query the search query
     * @param pageable pagination information
     * @return a page of matching message contents
     */
    Page<MessageContent> searchMessages(Long userId, String query, Pageable pageable);
    
    /**
     * Get messages by date range
     * 
     * @param userId the user ID
     * @param startDate the start date
     * @param endDate the end date
     * @param pageable pagination information
     * @return a page of message contents within the date range
     */
    Page<MessageContent> getMessagesByDateRange(Long userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Pageable pageable);
}