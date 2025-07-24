package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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
    
    @Autowired
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