package com.example.demo.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity for storing user-specific message instances
 */
@Entity
@Table(name = "sysmsg")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemMessage extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @NotNull(message = "Message ID is required")
    @Column(name = "message_id", nullable = false)
    private Long messageId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", referencedColumnName = "id", insertable = false, updatable = false)
    private MessageContent messageContent;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    /**
     * Mark the message as read
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
    
    /**
     * Create a new system message
     * 
     * @param userId the user ID
     * @param messageId the message ID
     * @return a new SystemMessage instance
     */
    public static SystemMessage create(Long userId, Long messageId) {
        SystemMessage systemMessage = new SystemMessage();
        systemMessage.setUserId(userId);
        systemMessage.setMessageId(messageId);
        systemMessage.setIsRead(false);
        return systemMessage;
    }
}