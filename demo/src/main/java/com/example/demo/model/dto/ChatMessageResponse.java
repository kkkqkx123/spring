package com.example.demo.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for chat message responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    
    private Long id;
    private String content;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private LocalDateTime timestamp;
    private Boolean isRead;
    
    /**
     * Create a chat message response
     * 
     * @param id the message ID
     * @param content the message content
     * @param senderId the sender ID
     * @param senderName the sender name
     * @param recipientId the recipient ID
     * @param recipientName the recipient name
     * @param timestamp the message timestamp
     * @param isRead whether the message has been read
     * @return a new chat message response
     */
    public static ChatMessageResponse create(
            Long id,
            String content,
            Long senderId,
            String senderName,
            Long recipientId,
            String recipientName,
            LocalDateTime timestamp,
            Boolean isRead) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(id);
        response.setContent(content);
        response.setSenderId(senderId);
        response.setSenderName(senderName);
        response.setRecipientId(recipientId);
        response.setRecipientName(recipientName);
        response.setTimestamp(timestamp);
        response.setIsRead(isRead);
        return response;
    }
}