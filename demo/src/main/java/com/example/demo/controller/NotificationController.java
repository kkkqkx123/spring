package com.example.demo.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.example.demo.model.dto.NotificationRequest;
import com.example.demo.model.dto.NotificationResponse;
import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.model.entity.User;
import com.example.demo.service.NotificationService;
import com.example.demo.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for notification management
 */
@RestController
@RequestMapping("/api/notifications")
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    private final UserService userService;
    
    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }
    
    /**
     * Get notifications for the authenticated user
     * 
     * @param authentication the authentication object
     * @param page the page number
     * @param size the page size
     * @param unreadOnly whether to return only unread notifications
     * @return a page of notification responses
     */
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<SystemMessage> notifications;
        if (unreadOnly) {
            notifications = notificationService.getUnreadNotifications(currentUser.getId(), pageable);
        } else {
            notifications = notificationService.getUserNotifications(currentUser.getId(), pageable);
        }
        
        Page<NotificationResponse> response = notifications.map(notification -> {
            MessageContent messageContent = notification.getMessageContent();
            return NotificationResponse.create(
                    notification.getId(),
                    notification.getMessageId(),
                    messageContent != null ? messageContent.getContent() : "Message content not available",
                    messageContent != null ? messageContent.getMessageType() : null,
                    notification.getCreatedAt(),
                    notification.getIsRead(),
                    notification.getReadAt()
            );
        });
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get the count of unread notifications for the authenticated user
     * 
     * @param authentication the authentication object
     * @return the count of unread notifications
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        long count = notificationService.countUnreadNotifications(currentUser.getId());
        return ResponseEntity.ok(count);
    }
    
    /**
     * Mark a notification as read
     * 
     * @param authentication the authentication object
     * @param id the notification ID
     * @return a response entity
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(Authentication authentication, @PathVariable Long id) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        boolean success = notificationService.markAsRead(id, currentUser.getId());
        
        if (success) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Mark multiple notifications as read
     * 
     * @param authentication the authentication object
     * @param ids the notification IDs
     * @return a response entity with the number of notifications marked as read
     */
    @PutMapping("/read")
    public ResponseEntity<Integer> markMultipleAsRead(
            Authentication authentication,
            @RequestBody List<Long> ids) {
        
        User currentUser = userService.getUserFromAuthentication(authentication);
        int count = notificationService.markMultipleAsRead(ids, currentUser.getId());
        return ResponseEntity.ok(count);
    }
    
    /**
     * Mark all notifications as read for the authenticated user
     * 
     * @param authentication the authentication object
     * @return a response entity with the number of notifications marked as read
     */
    @PutMapping("/read-all")
    public ResponseEntity<Integer> markAllAsRead(Authentication authentication) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        int count = notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(count);
    }
    
    /**
     * Delete a notification
     * 
     * @param authentication the authentication object
     * @param id the notification ID
     * @return a response entity
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(Authentication authentication, @PathVariable Long id) {
        User currentUser = userService.getUserFromAuthentication(authentication);
        boolean success = notificationService.deleteNotification(id, currentUser.getId());
        
        if (success) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Create a notification for a specific user
     * 
     * @param authentication the authentication object
     * @param request the notification request
     * @return a response entity with the created notification
     */
    @PostMapping("/user")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<NotificationResponse> createUserNotification(
            Authentication authentication,
            @Valid @RequestBody NotificationRequest request) {
        
        if (request.getUserId() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        MessageContent messageContent = notificationService.createNotification(request.getUserId(), request.getContent());
        
        NotificationResponse response = NotificationResponse.create(
                null, // System message ID not available here
                messageContent.getId(),
                messageContent.getContent(),
                messageContent.getMessageType(),
                messageContent.getCreatedAt(),
                false,
                null
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Create a notification for multiple users
     * 
     * @param authentication the authentication object
     * @param request the notification request
     * @return a response entity with the created notification
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<NotificationResponse> createMultiUserNotification(
            Authentication authentication,
            @Valid @RequestBody NotificationRequest request) {
        
        if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        MessageContent messageContent = notificationService.createNotificationForUsers(
                request.getUserIds(), request.getContent());
        
        NotificationResponse response = NotificationResponse.create(
                null, // System message ID not available here
                messageContent.getId(),
                messageContent.getContent(),
                messageContent.getMessageType(),
                messageContent.getCreatedAt(),
                false,
                null
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Create a notification for users with a specific role
     * 
     * @param authentication the authentication object
     * @param request the notification request
     * @return a response entity with the created notification
     */
    @PostMapping("/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationResponse> createRoleNotification(
            Authentication authentication,
            @Valid @RequestBody NotificationRequest request) {
        
        if (request.getRoleName() == null || request.getRoleName().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        MessageContent messageContent = notificationService.createNotificationForRole(
                request.getRoleName(), request.getContent());
        
        NotificationResponse response = NotificationResponse.create(
                null, // System message ID not available here
                messageContent.getId(),
                messageContent.getContent(),
                messageContent.getMessageType(),
                messageContent.getCreatedAt(),
                false,
                null
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}