package com.example.demo.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity for storing message content
 */
@Entity
@Table(name = "msgcontent")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageContent extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Enum for message types
     */
    public enum MessageType {
        SYSTEM_NOTIFICATION,
        CHAT_MESSAGE,
        ANNOUNCEMENT, BROADCAST
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Message content is required")
    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    @Column(name = "content", length = 2000, nullable = false)
    private String content;
    
    @NotNull(message = "Sender ID is required")
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @NotNull(message = "Message type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType;
    
    /**
     * Create a new system notification
     * 
     * @param content the notification content
     * @param senderId the sender ID
     * @return a new MessageContent instance
     */
    public static MessageContent createSystemNotification(String content, Long senderId) {
        MessageContent message = new MessageContent();
        message.setContent(content);
        message.setSenderId(senderId);
        message.setMessageType(MessageType.SYSTEM_NOTIFICATION);
        return message;
    }
    
    /**
     * Create a new chat message
     * 
     * @param content the message content
     * @param senderId the sender ID
     * @return a new MessageContent instance
     */
    public static MessageContent createChatMessage(String content, Long senderId) {
        MessageContent message = new MessageContent();
        message.setContent(content);
        message.setSenderId(senderId);
        message.setMessageType(MessageType.CHAT_MESSAGE);
        return message;
    }
    
    /**
     * Create a new announcement
     * 
     * @param content the announcement content
     * @param senderId the sender ID
     * @return a new MessageContent instance
     */
    public static MessageContent createAnnouncement(String content, Long senderId) {
        MessageContent message = new MessageContent();
        message.setContent(content);
        message.setSenderId(senderId);
        message.setMessageType(MessageType.ANNOUNCEMENT);
        return message;
    }
}