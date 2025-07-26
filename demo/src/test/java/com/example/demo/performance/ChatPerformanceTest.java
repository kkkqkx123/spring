package com.example.demo.performance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.example.demo.model.dto.ChatMessageRequest;

import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance tests for Chat system endpoints
 */
@DisplayName("Chat Performance Tests")
class ChatPerformanceTest extends BasePerformanceTest {

    @Test
    @DisplayName("Should handle high load on chat message sending")
    void testChatMessageSendingPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                ChatMessageRequest messageRequest = new ChatMessageRequest();
                messageRequest.setRecipientId(testUser.getId());
                messageRequest.setContent("Performance test message " + ThreadLocalRandom.current().nextInt(1000));
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/chat/send",
                        HttpMethod.POST,
                        new HttpEntity<>(messageRequest, createAuthHeaders()),
                        String.class
                );
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    successCount.incrementAndGet();
                } else {
                    errorCount.incrementAndGet();
                }
                
                long responseTime = System.currentTimeMillis() - startTime;
                recordResponseTime(responseTime);
                
            } catch (Exception e) {
                errorCount.incrementAndGet();
            }
        };

        // Test with 40 concurrent threads, 5 requests each
        runConcurrentTest(task, 40, 5);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(200, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 1000, "Average response time should be less than 1 second");
        assertTrue(metrics.successRate > 95, "Success rate should be above 95%");
        assertTrue(metrics.throughput > 15, "Throughput should be above 15 requests/sec");
    }

    @Test
    @DisplayName("Should handle concurrent conversation retrieval")
    void testConversationRetrievalPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/chat/conversation/" + testUser.getId() + "?page=0&size=20",
                        HttpMethod.GET,
                        new HttpEntity<>(createAuthHeaders()),
                        String.class
                );
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    successCount.incrementAndGet();
                } else {
                    errorCount.incrementAndGet();
                }
                
                long responseTime = System.currentTimeMillis() - startTime;
                recordResponseTime(responseTime);
                
            } catch (Exception e) {
                errorCount.incrementAndGet();
            }
        };

        // Test with 60 concurrent threads, 8 requests each
        runConcurrentTest(task, 60, 8);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(480, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 800, "Average response time should be less than 800ms");
        assertTrue(metrics.successRate > 98, "Success rate should be above 98%");
        assertTrue(metrics.throughput > 20, "Throughput should be above 20 requests/sec");
    }

    @Test
    @DisplayName("Should handle unread count queries efficiently")
    void testUnreadCountPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/chat/unread/count",
                        HttpMethod.GET,
                        new HttpEntity<>(createAuthHeaders()),
                        String.class
                );
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    successCount.incrementAndGet();
                } else {
                    errorCount.incrementAndGet();
                }
                
                long responseTime = System.currentTimeMillis() - startTime;
                recordResponseTime(responseTime);
                
            } catch (Exception e) {
                errorCount.incrementAndGet();
            }
        };

        // Test with 100 concurrent threads, 10 requests each (this should be very fast)
        runConcurrentTest(task, 100, 10);
        
        // Verify performance criteria (should be very fast)
        PerformanceMetrics metrics = calculateMetrics(1000, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 200, "Average response time should be less than 200ms");
        assertTrue(metrics.successRate > 99, "Success rate should be above 99%");
        assertTrue(metrics.throughput > 50, "Throughput should be above 50 requests/sec");
    }

    @Test
    @DisplayName("Should handle mixed chat operations under load")
    void testMixedChatOperationsPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                int operation = ThreadLocalRandom.current().nextInt(3);
                ResponseEntity<String> response;
                
                switch (operation) {
                    case 0: // Send message
                        ChatMessageRequest messageRequest = new ChatMessageRequest();
                        messageRequest.setRecipientId(testUser.getId());
                        messageRequest.setContent("Mixed test message " + ThreadLocalRandom.current().nextInt(1000));
                        
                        response = restTemplate.exchange(
                                "/api/chat/send",
                                HttpMethod.POST,
                                new HttpEntity<>(messageRequest, createAuthHeaders()),
                                String.class
                        );
                        break;
                        
                    case 1: // Get conversation
                        response = restTemplate.exchange(
                                "/api/chat/conversation/" + testUser.getId() + "?page=0&size=10",
                                HttpMethod.GET,
                                new HttpEntity<>(createAuthHeaders()),
                                String.class
                        );
                        break;
                        
                    case 2: // Get unread count
                        response = restTemplate.exchange(
                                "/api/chat/unread/count",
                                HttpMethod.GET,
                                new HttpEntity<>(createAuthHeaders()),
                                String.class
                        );
                        break;
                        
                    default:
                        throw new IllegalStateException("Invalid operation");
                }
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    successCount.incrementAndGet();
                } else {
                    errorCount.incrementAndGet();
                }
                
                long responseTime = System.currentTimeMillis() - startTime;
                recordResponseTime(responseTime);
                
            } catch (Exception e) {
                errorCount.incrementAndGet();
            }
        };

        // Test with 50 concurrent threads, 6 requests each
        runConcurrentTest(task, 50, 6);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(300, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 1200, "Average response time should be less than 1.2 seconds");
        assertTrue(metrics.successRate > 95, "Success rate should be above 95%");
        assertTrue(metrics.throughput > 12, "Throughput should be above 12 requests/sec");
    }
}