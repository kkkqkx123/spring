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
}