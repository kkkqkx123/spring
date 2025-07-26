package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.dto.ChatMessageRequest;
import com.example.demo.model.dto.ChatMessageResponse;
import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.User;
import com.example.demo.service.ChatService;
import com.example.demo.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for chat functionality
 */
@RestController
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {
    
    private final ChatService chatService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    
    public ChatController(
            ChatService chatService,
            UserService userService,
            SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }
    
    /**
     * Send a chat message via REST
     * 
     * @param authentication the authentication object
     * @param request the chat message request
     * @return a response entity with the chat message response
     */
    @PostMapping("/send")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            Authentication authentication,
            @Valid @RequestBody ChatMessageRequest request) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        User recipient = userService.getUserById(request.getRecipientId());
        
        if (recipient == null) {
            return ResponseEntity.badRequest().build();
        }
        
        MessageContent messageContent = chatService.sendMessage(
                currentUser.getId(), recipient.getId(), request.getContent());
        
        ChatMessageResponse response = createChatMessageResponse(messageContent, currentUser, recipient);
        
        // Send the message via WebSocket
        messagingTemplate.convertAndSendToUser(
                recipient.getUsername(),
                "/queue/messages",
                response);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Send a chat message via WebSocket
     * 
     * @param authentication the authentication object
     * @param request the chat message request
     */
    @MessageMapping("/chat")
    public void handleChatMessage(Authentication authentication, @Payload ChatMessageRequest request) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        User recipient = userService.getUserById(request.getRecipientId());
        
        if (recipient != null) {
            MessageContent messageContent = chatService.sendMessage(
                    currentUser.getId(), recipient.getId(), request.getContent());
            
            ChatMessageResponse response = createChatMessageResponse(messageContent, currentUser, recipient);
            
            // Send the message to the recipient
            messagingTemplate.convertAndSendToUser(
                    recipient.getUsername(),
                    "/queue/messages",
                    response);
            
            // Send a copy back to the sender for confirmation
            messagingTemplate.convertAndSendToUser(
                    currentUser.getUsername(),
                    "/queue/messages",
                    response);
        }
    }
    
    /**
     * Get conversation with another user
     * 
     * @param authentication the authentication object
     * @param userId the other user ID
     * @param page the page number
     * @param size the page size
     * @return a page of chat message responses
     */
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<Page<ChatMessageResponse>> getConversation(
            Authentication authentication,
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        User otherUser = userService.getUserById(userId);
        
        if (otherUser == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MessageContent> messages = chatService.getConversation(currentUser.getId(), userId, pageable);
        
        Page<ChatMessageResponse> response = messages.map(message -> {
            User sender = userService.getUserById(message.getSenderId());
            User recipient = message.getSenderId().equals(currentUser.getId()) ? otherUser : currentUser;
            return createChatMessageResponse(message, sender, recipient);
        });
        
        // Mark messages as read
        chatService.markConversationAsRead(currentUser.getId(), userId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get recent conversations
     * 
     * @param authentication the authentication object
     * @return a list of user IDs
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<User>> getRecentConversations(Authentication authentication) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        List<Long> userIds = chatService.getRecentConversations(currentUser.getId());
        
        List<User> users = userIds.stream()
                .map(id -> userService.getUserById(id))
                .filter(user -> user != null)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(users);
    }
    
    /**
     * Mark conversation as read
     * 
     * @param authentication the authentication object
     * @param userId the other user ID
     * @return a response entity with the number of messages marked as read
     */
    @PutMapping("/conversation/{userId}/read")
    public ResponseEntity<Integer> markConversationAsRead(
            Authentication authentication,
            @PathVariable Long userId) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        int count = chatService.markConversationAsRead(currentUser.getId(), userId);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get unread message count
     * 
     * @param authentication the authentication object
     * @return the count of unread messages
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        long count = chatService.countUnreadMessages(currentUser.getId());
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get all chat messages (paginated)
     * 
     * @param authentication the authentication object
     * @param page the page number
     * @param size the page size
     * @return a page of chat message responses
     */
    @GetMapping("/messages")
    public ResponseEntity<Page<ChatMessageResponse>> getAllMessages(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MessageContent> messages = chatService.getAllMessages(currentUser.getId(), pageable);
        
        Page<ChatMessageResponse> response = messages.map(message -> {
            User sender = userService.getUserById(message.getSenderId());
            return createChatMessageResponse(message, sender, currentUser);
        });
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Create a new chat message
     * 
     * @param authentication the authentication object
     * @param messageContent the message content
     * @return the created message
     */
    @PostMapping("/messages")
    public ResponseEntity<ChatMessageResponse> createMessage(
            Authentication authentication,
            @RequestBody MessageContent messageContent) {
        
        log.debug("Creating message with authentication: {}", authentication != null ? authentication.getName() : "null");
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        if (currentUser == null) {
            log.warn("Current user not found from authentication: {}", authentication != null ? authentication.getName() : "null");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.debug("Current user found: {} (ID: {})", currentUser.getUsername(), currentUser.getId());
        
        // Manual validation for content
        if (messageContent.getContent() == null || messageContent.getContent().trim().isEmpty()) {
            log.warn("Message content is empty or null");
            return ResponseEntity.badRequest().build();
        }
        
        if (messageContent.getContent().length() > 2000) {
            log.warn("Message content exceeds maximum length of 2000 characters");
            return ResponseEntity.badRequest().build();
        }
        
        messageContent.setSenderId(currentUser.getId());
        messageContent.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);
        
        MessageContent savedMessage = chatService.saveMessage(messageContent);
        ChatMessageResponse response = createChatMessageResponse(savedMessage, currentUser, currentUser);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get a chat message by ID
     * 
     * @param authentication the authentication object
     * @param id the message ID
     * @return the chat message response
     */
    @GetMapping("/messages/{id}")
    public ResponseEntity<ChatMessageResponse> getMessageById(
            Authentication authentication,
            @PathVariable Long id) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        MessageContent message = chatService.getMessageById(id);
        
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        
        User sender = userService.getUserById(message.getSenderId());
        ChatMessageResponse response = createChatMessageResponse(message, sender, currentUser);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update a chat message
     * 
     * @param authentication the authentication object
     * @param id the message ID
     * @param messageContent the updated message content
     * @return the updated message
     */
    @PutMapping("/messages/{id}")
    public ResponseEntity<ChatMessageResponse> updateMessage(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody MessageContent messageContent) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        MessageContent existingMessage = chatService.getMessageById(id);
        
        if (existingMessage == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Check if user owns the message or is admin
        if (!existingMessage.getSenderId().equals(currentUser.getId()) && 
            !currentUser.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        existingMessage.setContent(messageContent.getContent());
        MessageContent updatedMessage = chatService.updateMessage(existingMessage);
        
        User sender = userService.getUserById(updatedMessage.getSenderId());
        ChatMessageResponse response = createChatMessageResponse(updatedMessage, sender, currentUser);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a chat message
     * 
     * @param authentication the authentication object
     * @param id the message ID
     * @return no content response
     */
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> deleteMessage(
            Authentication authentication,
            @PathVariable Long id) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        MessageContent message = chatService.getMessageById(id);
        
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Check if user owns the message or is admin
        if (!message.getSenderId().equals(currentUser.getId()) && 
            !currentUser.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        chatService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get recent chat messages
     * 
     * @param authentication the authentication object
     * @param limit the maximum number of messages to return
     * @return a list of recent chat message responses
     */
    @GetMapping("/messages/recent")
    public ResponseEntity<List<ChatMessageResponse>> getRecentMessages(
            Authentication authentication,
            @RequestParam(defaultValue = "10") int limit) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        List<MessageContent> messages = chatService.getRecentMessages(currentUser.getId(), limit);
        
        List<ChatMessageResponse> response = messages.stream()
                .map(message -> {
                    User sender = userService.getUserById(message.getSenderId());
                    return createChatMessageResponse(message, sender, currentUser);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Search chat messages
     * 
     * @param authentication the authentication object
     * @param query the search query
     * @param page the page number
     * @param size the page size
     * @return a page of matching chat message responses
     */
    @GetMapping("/messages/search")
    public ResponseEntity<Page<ChatMessageResponse>> searchMessages(
            Authentication authentication,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MessageContent> messages = chatService.searchMessages(currentUser.getId(), query, pageable);
        
        Page<ChatMessageResponse> response = messages.map(message -> {
            User sender = userService.getUserById(message.getSenderId());
            return createChatMessageResponse(message, sender, currentUser);
        });
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get chat messages by date range
     * 
     * @param authentication the authentication object
     * @param startDate the start date
     * @param endDate the end date
     * @param page the page number
     * @param size the page size
     * @return a page of chat message responses within the date range
     */
    @GetMapping("/messages/date-range")
    public ResponseEntity<Page<ChatMessageResponse>> getMessagesByDateRange(
            Authentication authentication,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        LocalDateTime start = LocalDateTime.parse(startDate);
        LocalDateTime end = LocalDateTime.parse(endDate);
        
        Page<MessageContent> messages = chatService.getMessagesByDateRange(currentUser.getId(), start, end, pageable);
        
        Page<ChatMessageResponse> response = messages.map(message -> {
            User sender = userService.getUserById(message.getSenderId());
            return createChatMessageResponse(message, sender, currentUser);
        });
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Create a chat message response from a message content and users
     * 
     * @param messageContent the message content
     * @param sender the sender
     * @param recipient the recipient
     * @return a chat message response
     */
    private ChatMessageResponse createChatMessageResponse(
            MessageContent messageContent, User sender, User recipient) {
        
        return ChatMessageResponse.create(
                messageContent.getId(),
                messageContent.getContent(),
                sender.getId(),
                sender.getFullName(),
                recipient.getId(),
                recipient.getFullName(),
                messageContent.getCreatedAt(),
                false
        );
    }
}