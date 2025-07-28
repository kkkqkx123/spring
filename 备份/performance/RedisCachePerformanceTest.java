package com.example.demo.performance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance tests for Redis cache operations
 */
@DisplayName("Redis Cache Performance Tests")
class RedisCachePerformanceTest extends BasePerformanceTest {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    @DisplayName("Should handle high-frequency cache operations")
    void testRedisCacheOperationsPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                String key = "perf:test:" + ThreadLocalRandom.current().nextInt(1000);
                String value = "Performance test value " + ThreadLocalRandom.current().nextInt(10000);
                
                // Set operation
                redisTemplate.opsForValue().set(key, value, 60, TimeUnit.SECONDS);
                
                // Get operation
                Object retrievedValue = redisTemplate.opsForValue().get(key);
                
                if (value.equals(retrievedValue)) {
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

        // Test with 100 concurrent threads, 20 requests each
        runConcurrentTest(task, 100, 20);
        
        // Verify performance criteria (Redis should be very fast)
        PerformanceMetrics metrics = calculateMetrics(2000, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 50, "Average response time should be less than 50ms");
        assertTrue(metrics.successRate > 99, "Success rate should be above 99%");
        assertTrue(metrics.throughput > 100, "Throughput should be above 100 requests/sec");
    }

    @Test
    @DisplayName("Should handle cached employee data retrieval performance")
    void testCachedEmployeeDataPerformance() throws InterruptedException {
        // Pre-populate cache with employee data
        for (int i = 0; i < 100; i++) {
            String key = "employee:cache:" + i;
            String value = "Employee data " + i;
            redisTemplate.opsForValue().set(key, value, 300, TimeUnit.SECONDS);
        }

        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                // First request - should hit database and cache result
                ResponseEntity<String> response1 = restTemplate.exchange(
                        "/api/employees?page=0&size=10",
                        HttpMethod.GET,
                        new HttpEntity<>(createAuthHeaders()),
                        String.class
                );
                
                // Second request - should hit cache
                ResponseEntity<String> response2 = restTemplate.exchange(
                        "/api/employees?page=0&size=10",
                        HttpMethod.GET,
                        new HttpEntity<>(createAuthHeaders()),
                        String.class
                );
                
                if (response1.getStatusCode().is2xxSuccessful() && 
                    response2.getStatusCode().is2xxSuccessful()) {
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

        // Test with 30 concurrent threads, 5 requests each
        runConcurrentTest(task, 30, 5);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(150, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 800, "Average response time should be less than 800ms with caching");
        assertTrue(metrics.successRate > 95, "Success rate should be above 95%");
        assertTrue(metrics.throughput > 15, "Throughput should be above 15 requests/sec with caching");
    }

    @Test
    @DisplayName("Should handle cache invalidation performance")
    void testCacheInvalidationPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                String key = "invalidation:test:" + ThreadLocalRandom.current().nextInt(100);
                String value = "Test value for invalidation";
                
                // Set value
                redisTemplate.opsForValue().set(key, value, 60, TimeUnit.SECONDS);
                
                // Verify it exists
                Boolean exists = redisTemplate.hasKey(key);
                
                // Delete (invalidate)
                Boolean deleted = redisTemplate.delete(key);
                
                // Verify it's gone
                Boolean existsAfterDelete = redisTemplate.hasKey(key);
                
                if (exists && deleted && !existsAfterDelete) {
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

        // Test with 80 concurrent threads, 10 requests each
        runConcurrentTest(task, 80, 10);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(800, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 30, "Average response time should be less than 30ms");
        assertTrue(metrics.successRate > 99, "Success rate should be above 99%");
        assertTrue(metrics.throughput > 150, "Throughput should be above 150 requests/sec");
    }

    @Test
    @DisplayName("Should handle session cache performance")
    void testSessionCachePerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                String sessionId = "session:" + ThreadLocalRandom.current().nextInt(1000);
                String userData = "User session data " + ThreadLocalRandom.current().nextInt(10000);
                
                // Store session data
                redisTemplate.opsForValue().set(sessionId, userData, 1800, TimeUnit.SECONDS); // 30 minutes
                
                // Retrieve session data
                Object retrievedData = redisTemplate.opsForValue().get(sessionId);
                
                // Update session expiry
                redisTemplate.expire(sessionId, 1800, TimeUnit.SECONDS);
                
                if (userData.equals(retrievedData)) {
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

        // Test with 60 concurrent threads, 15 requests each
        runConcurrentTest(task, 60, 15);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(900, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 40, "Average response time should be less than 40ms");
        assertTrue(metrics.successRate > 99, "Success rate should be above 99%");
        assertTrue(metrics.throughput > 120, "Throughput should be above 120 requests/sec");
    }

    @Test
    @DisplayName("Should handle permission cache performance")
    void testPermissionCachePerformance() throws InterruptedException {
        // Pre-populate permission cache
        for (int i = 0; i < 50; i++) {
            String key = "user:permissions:" + i;
            String permissions = "READ,WRITE,DELETE";
            redisTemplate.opsForValue().set(key, permissions, 600, TimeUnit.SECONDS);
        }

        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                String userId = String.valueOf(ThreadLocalRandom.current().nextInt(50));
                String permissionKey = "user:permissions:" + userId;
                
                // Get user permissions from cache
                Object permissions = redisTemplate.opsForValue().get(permissionKey);
                
                // Simulate permission check
                boolean hasPermission = permissions != null && 
                                      permissions.toString().contains("READ");
                
                if (hasPermission) {
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

        // Test with 150 concurrent threads, 10 requests each
        runConcurrentTest(task, 150, 10);
        
        // Verify performance criteria (permission checks should be very fast)
        PerformanceMetrics metrics = calculateMetrics(1500, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 20, "Average response time should be less than 20ms");
        assertTrue(metrics.successRate > 99, "Success rate should be above 99%");
        assertTrue(metrics.throughput > 200, "Throughput should be above 200 requests/sec");
    }
}