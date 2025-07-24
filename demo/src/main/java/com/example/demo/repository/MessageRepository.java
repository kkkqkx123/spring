package com.example.demo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.MessageContent.MessageType;

/**
 * Repository for MessageContent entity
 */
@Repository
public interface MessageRepository extends JpaRepository<MessageContent, Long> {
    
    /**
     * Find messages by sender ID
     * 
     * @param senderId the sender ID
     * @param pageable pagination information
     * @return a Page of messages from the specified sender
     */
    Page<MessageContent> findBySenderId(Long senderId, Pageable pageable);
    
    /**
     * Find messages by message type
     * 
     * @param messageType the message type
     * @param pageable pagination information
     * @return a Page of messages of the specified type
     */
    Page<MessageContent> findByMessageType(MessageType messageType, Pageable pageable);
    
    /**
     * Find messages by sender ID and message type
     * 
     * @param senderId the sender ID
     * @param messageType the message type
     * @param pageable pagination information
     * @return a Page of messages from the specified sender and of the specified type
     */
    Page<MessageContent> findBySenderIdAndMessageType(Long senderId, MessageType messageType, Pageable pageable);
    
    /**
     * Search messages by content
     * 
     * @param searchTerm the search term
     * @param pageable pagination information
     * @return a Page of messages matching the search term
     */
    @Query("SELECT m FROM MessageContent m WHERE LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<MessageContent> searchByContent(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    /**
     * Find recent messages by message type
     * 
     * @param messageType the message type
     * @param limit the maximum number of messages to return
     * @return a List of recent messages of the specified type
     */
    @Query("SELECT m FROM MessageContent m WHERE m.messageType = :messageType ORDER BY m.createdAt DESC")
    List<MessageContent> findRecentByType(@Param("messageType") MessageType messageType, Pageable pageable);
}