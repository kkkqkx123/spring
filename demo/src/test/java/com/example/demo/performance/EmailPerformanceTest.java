package com.example.demo.performance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.example.demo.model.dto.EmailRequest;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance tests for Email system endpoints
 */
@DisplayName("Email Performance Tests")
class EmailPerformanceTest extends BasePerformanceTest {

    @Test
    @DisplayName("Should handle concurrent single email sending")
    void testSingleEmailSendingPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                EmailRequest emailRequest = createTestEmailRequest();
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/email/send",
                        HttpMethod.POST,
                        new HttpEntity<>(emailRequest, createAuthHeaders()),
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

        // Test with 20 concurrent threads, 3 requests each (email sending is resource intensive)
        runConcurrentTest(task, 20, 3);
        
        // Verify performance criteria (more lenient for email operations)
        PerformanceMetrics metrics = calculateMetrics(60, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 3000, "Average response time should be less than 3 seconds");
        assertTrue(metrics.successRate > 85, "Success rate should be above 85%");
        assertTrue(metrics.throughput > 5, "Throughput should be above 5 requests/sec");
    }

    @Test
    @DisplayName("Should handle bulk email sending performance")
    void testBulkEmailSendingPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                EmailRequest bulkEmailRequest = createBulkEmailRequest();
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/email/send-bulk",
                        HttpMethod.POST,
                        new HttpEntity<>(bulkEmailRequest, createAuthHeaders()),
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

        // Test with 10 concurrent threads, 2 requests each (bulk email is very resource intensive)
        runConcurrentTest(task, 10, 2);
        
        // Verify performance criteria (very lenient for bulk email operations)
        PerformanceMetrics metrics = calculateMetrics(20, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 10000, "Average response time should be less than 10 seconds");
        assertTrue(metrics.successRate > 80, "Success rate should be above 80%");
        assertTrue(metrics.throughput > 1, "Throughput should be above 1 request/sec");
    }

    @Test
    @DisplayName("Should handle email template processing performance")
    void testEmailTemplatePerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                EmailRequest templateEmailRequest = createTemplateEmailRequest();
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/email/send-template",
                        HttpMethod.POST,
                        new HttpEntity<>(templateEmailRequest, createAuthHeaders()),
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

        // Test with 15 concurrent threads, 4 requests each
        runConcurrentTest(task, 15, 4);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(60, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 4000, "Average response time should be less than 4 seconds");
        assertTrue(metrics.successRate > 85, "Success rate should be above 85%");
        assertTrue(metrics.throughput > 3, "Throughput should be above 3 requests/sec");
    }

    @Test
    @DisplayName("Should handle mixed email operations under load")
    void testMixedEmailOperationsPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                int operation = ThreadLocalRandom.current().nextInt(2);
                ResponseEntity<String> response;
                
                switch (operation) {
                    case 0: // Single email
                        EmailRequest singleEmail = createTestEmailRequest();
                        response = restTemplate.exchange(
                                "/api/email/send",
                                HttpMethod.POST,
                                new HttpEntity<>(singleEmail, createAuthHeaders()),
                                String.class
                        );
                        break;
                        
                    case 1: // Template email
                        EmailRequest templateEmail = createTemplateEmailRequest();
                        response = restTemplate.exchange(
                                "/api/email/send-template",
                                HttpMethod.POST,
                                new HttpEntity<>(templateEmail, createAuthHeaders()),
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

        // Test with 12 concurrent threads, 5 requests each
        runConcurrentTest(task, 12, 5);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(60, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 5000, "Average response time should be less than 5 seconds");
        assertTrue(metrics.successRate > 80, "Success rate should be above 80%");
        assertTrue(metrics.throughput > 2, "Throughput should be above 2 requests/sec");
    }

    private EmailRequest createTestEmailRequest() {
        EmailRequest request = new EmailRequest();
        request.setTo("test" + ThreadLocalRandom.current().nextInt(1000) + "@example.com");
        request.setSubject("Performance Test Email " + ThreadLocalRandom.current().nextInt(1000));
        request.setTemplate("default-template");
        return request;
    }

    private EmailRequest createBulkEmailRequest() {
        EmailRequest request = new EmailRequest();
        request.setRecipients(Arrays.asList(
                "bulk1@example.com",
                "bulk2@example.com",
                "bulk3@example.com",
                "bulk4@example.com",
                "bulk5@example.com"
        ));
        request.setSubject("Bulk Performance Test Email " + ThreadLocalRandom.current().nextInt(1000));
        request.setTemplate("bulk-template");
        return request;
    }

    private EmailRequest createTemplateEmailRequest() {
        EmailRequest request = new EmailRequest();
        request.setRecipients(Arrays.asList("template" + ThreadLocalRandom.current().nextInt(1000) + "@example.com"));
        request.setSubject("Template Performance Test Email");
        request.setTemplate("welcome-template");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", "Performance Test User");
        variables.put("company", "Test Company");
        variables.put("date", "2024-01-01");
        request.setVariables(variables);
        
        return request;
    }
}