package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.SystemMessage;

/**
 * Repository for SystemMessage entity
 */
@Repository
public interface SystemMessageRepository extends JpaRepository<SystemMessage, Long> {
    
    /**
     * Find system messages by user ID
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return a Page of system messages for the specified user
     */
    Page<SystemMessage> findByUserId(Long userId, Pageable pageable);
    
    /**
     * Find unread system messages by user ID
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return a Page of unread system messages for the specified user
     */
    Page<SystemMessage> findByUserIdAndIsReadFalse(Long userId, Pageable pageable);
    
    /**
     * Find system message by user ID and message ID
     * 
     * @param userId the user ID
     * @param messageId the message ID
     * @return an Optional containing the system message if found
     */
    Optional<SystemMessage> findByUserIdAndMessageId(Long userId, Long messageId);
    
    /**
     * Count unread system messages by user ID
     * 
     * @param userId the user ID
     * @return the number of unread system messages for the specified user
     */
    long countByUserIdAndIsReadFalse(Long userId);
    
    /**
     * Mark system messages as read by IDs
     * 
     * @param ids the system message IDs
     * @return the number of updated records
     */
    @Modifying
    @Query("UPDATE SystemMessage sm SET sm.isRead = true, sm.readAt = CURRENT_TIMESTAMP WHERE sm.id IN :ids")
    int markAsReadByIds(@Param("ids") List<Long> ids);
    
    /**
     * Mark all system messages as read for a user
     * 
     * @param userId the user ID
     * @return the number of updated records
     */
    @Modifying
    @Query("UPDATE SystemMessage sm SET sm.isRead = true, sm.readAt = CURRENT_TIMESTAMP WHERE sm.userId = :userId AND sm.isRead = false")
    int markAllAsReadForUser(@Param("userId") Long userId);
    
    /**
     * Find system messages with message content by user ID
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return a Page of system messages with message content for the specified user
     */
    @Query("SELECT sm FROM SystemMessage sm JOIN FETCH sm.messageContent WHERE sm.userId = :userId")
    Page<SystemMessage> findWithContentByUserId(@Param("userId") Long userId, Pageable pageable);
}