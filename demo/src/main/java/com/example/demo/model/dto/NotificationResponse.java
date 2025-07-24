package com.example.demo.model.dto;

import java.time.LocalDateTime;

import com.example.demo.model.entity.MessageContent.MessageType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for notification responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    
    private Long id;
    private Long messageId;
    private String content;
    private MessageType messageType;
    private LocalDateTime createdAt;
    private Boolean isRead;
    private LocalDateTime readAt;
    
    /**
     * Create a notification response from message content and system message
     * 
     * @param systemMessageId the system message ID
     * @param messageId the message content ID
     * @param content the message content
     * @param messageType the message type
     * @param createdAt the creation timestamp
     * @param isRead whether the message has been read
     * @param readAt the read timestamp
     * @return a new notification response
     */
    public static NotificationResponse create(
            Long systemMessageId,
            Long messageId,
            String content,
            MessageType messageType,
            LocalDateTime createdAt,
            Boolean isRead,
            LocalDateTime readAt) {
        NotificationResponse response = new NotificationResponse();
        response.setId(systemMessageId);
        response.setMessageId(messageId);
        response.setContent(content);
        response.setMessageType(messageType);
        response.setCreatedAt(createdAt);
        response.setIsRead(isRead);
        response.setReadAt(readAt);
        return response;
    }
}