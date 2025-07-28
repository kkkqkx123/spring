package com.example.demo.performance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.example.demo.model.entity.Employee;
import com.example.demo.model.dto.ChatMessageRequest;

import java.time.LocalDate;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive load tests simulating real-world usage patterns
 */
@DisplayName("Load Tests")
class LoadTest extends BasePerformanceTest {

    @Test
    @DisplayName("Should handle realistic mixed workload")
    void testRealisticMixedWorkload() throws InterruptedException {
        // Simulate a realistic workload with different user behaviors
        ExecutorService executor = Executors.newFixedThreadPool(100);
        
        long startTime = System.currentTimeMillis();
        
        // HR Manager workload (20% of users)
        for (int i = 0; i < 20; i++) {
            executor.submit(this::simulateHRManagerWorkload);
        }
        
        // Regular Employee workload (70% of users)
        for (int i = 0; i < 70; i++) {
            executor.submit(this::simulateRegularEmployeeWorkload);
        }
        
        // Admin workload (10% of users)
        for (int i = 0; i < 10; i++) {
            executor.submit(this::simulateAdminWorkload);
        }
        
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.MINUTES);
        
        long endTime = System.currentTimeMillis();
        long totalDuration = endTime - startTime;
        
        // Calculate and verify metrics
        int totalRequests = successCount.get() + errorCount.get();
        PerformanceMetrics metrics = calculateMetrics(totalRequests, totalDuration);
        printMetrics(metrics);
        
        // Verify overall system performance under mixed load
        assertTrue(metrics.successRate > 90, "Success rate should be above 90% under mixed load");
        assertTrue(metrics.averageResponseTime < 2000, "Average response time should be less than 2 seconds");
        assertTrue(metrics.throughput > 20, "Throughput should be above 20 requests/sec");
    }

    @Test
    @DisplayName("Should handle peak load simulation")
    void testPeakLoadSimulation() throws InterruptedException {
        // Simulate peak usage (e.g., beginning of work day, payroll processing time)
        ExecutorService executor = Executors.newFixedThreadPool(200);
        
        long startTime = System.currentTimeMillis();
        
        // High concurrent load
        for (int i = 0; i < 200; i++) {
            executor.submit(() -> {
                for (int j = 0; j < 5; j++) {
                    simulatePeakTimeOperation();
                    try {
                        Thread.sleep(ThreadLocalRandom.current().nextInt(100, 500));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(15, TimeUnit.MINUTES);
        
        long endTime = System.currentTimeMillis();
        long totalDuration = endTime - startTime;
        
        // Calculate and verify metrics
        int totalRequests = successCount.get() + errorCount.get();
        PerformanceMetrics metrics = calculateMetrics(totalRequests, totalDuration);
        printMetrics(metrics);
        
        // Verify system can handle peak load
        assertTrue(metrics.successRate > 85, "Success rate should be above 85% under peak load");
        assertTrue(metrics.averageResponseTime < 3000, "Average response time should be less than 3 seconds under peak load");
    }

    @Test
    @DisplayName("Should handle sustained load over time")
    void testSustainedLoad() throws InterruptedException {
        // Simulate sustained load over a longer period
        ExecutorService executor = Executors.newFixedThreadPool(50);
        AtomicInteger operationCount = new AtomicInteger(0);
        
        long startTime = System.currentTimeMillis();
        long testDuration = 5 * 60 * 1000; // 5 minutes
        
        for (int i = 0; i < 50; i++) {
            executor.submit(() -> {
                long endTime = startTime + testDuration;
                while (System.currentTimeMillis() < endTime) {
                    simulateSustainedOperation();
                    operationCount.incrementAndGet();
                    try {
                        Thread.sleep(ThreadLocalRandom.current().nextInt(1000, 3000));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.MINUTES);
        
        long actualDuration = System.currentTimeMillis() - startTime;
        
        // Calculate and verify metrics
        int totalRequests = successCount.get() + errorCount.get();
        PerformanceMetrics metrics = calculateMetrics(totalRequests, actualDuration);
        printMetrics(metrics);
        
        // Verify system stability under sustained load
        assertTrue(metrics.successRate > 95, "Success rate should be above 95% under sustained load");
        assertTrue(metrics.averageResponseTime < 1500, "Average response time should be less than 1.5 seconds");
        assertTrue(totalRequests > 500, "Should handle at least 500 requests over 5 minutes");
    }

    @Test
    @DisplayName("Should handle database stress test")
    void testDatabaseStressTest() throws InterruptedException {
        // Create a large dataset first
        createLargeDataset();
        
        ExecutorService executor = Executors.newFixedThreadPool(80);
        
        long startTime = System.currentTimeMillis();
        
        // Stress test database operations
        for (int i = 0; i < 80; i++) {
            executor.submit(() -> {
                for (int j = 0; j < 10; j++) {
                    simulateDatabaseIntensiveOperation();
                    try {
                        Thread.sleep(ThreadLocalRandom.current().nextInt(100, 300));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(10, TimeUnit.MINUTES);
        
        long endTime = System.currentTimeMillis();
        long totalDuration = endTime - startTime;
        
        // Calculate and verify metrics
        int totalRequests = successCount.get() + errorCount.get();
        PerformanceMetrics metrics = calculateMetrics(totalRequests, totalDuration);
        printMetrics(metrics);
        
        // Verify database can handle stress
        assertTrue(metrics.successRate > 90, "Success rate should be above 90% under database stress");
        assertTrue(metrics.averageResponseTime < 2500, "Average response time should be less than 2.5 seconds");
    }

    private void simulateHRManagerWorkload() {
        try {
            // HR Manager typical operations
            int operation = ThreadLocalRandom.current().nextInt(5);
            long startTime = System.currentTimeMillis();
            ResponseEntity<String> response;
            
            switch (operation) {
                case 0: // View all employees
                    response = restTemplate.exchange(
                            "/api/employees?page=0&size=20",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 1: // Create new employee
                    Employee newEmployee = createTestEmployee();
                    response = restTemplate.exchange(
                            "/api/employees",
                            HttpMethod.POST,
                            new HttpEntity<>(newEmployee, createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 2: // View payroll
                    response = restTemplate.exchange(
                            "/api/payroll?page=0&size=10",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 3: // Export employee data
                    response = restTemplate.exchange(
                            "/api/employees/export",
                            HttpMethod.POST,
                            new HttpEntity<>("[]", createAuthHeaders()),
                            byte[].class
                    ).getStatusCode().is2xxSuccessful() ? 
                    ResponseEntity.ok("Success") : ResponseEntity.badRequest().body("Error");
                    break;
                    
                case 4: // Search employees
                    response = restTemplate.exchange(
                            "/api/employees/search?name=Test&page=0&size=10",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                default:
                    return;
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
    }

    private void simulateRegularEmployeeWorkload() {
        try {
            // Regular employee typical operations
            int operation = ThreadLocalRandom.current().nextInt(4);
            long startTime = System.currentTimeMillis();
            ResponseEntity<String> response;
            
            switch (operation) {
                case 0: // View employee directory
                    response = restTemplate.exchange(
                            "/api/employees?page=0&size=10",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 1: // Send chat message
                    ChatMessageRequest messageRequest = new ChatMessageRequest();
                    messageRequest.setRecipientId(testUser.getId());
                    messageRequest.setContent("Regular employee message " + ThreadLocalRandom.current().nextInt(1000));
                    
                    response = restTemplate.exchange(
                            "/api/chat/send",
                            HttpMethod.POST,
                            new HttpEntity<>(messageRequest, createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 2: // Check notifications
                    response = restTemplate.exchange(
                            "/api/notifications",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 3: // View departments
                    response = restTemplate.exchange(
                            "/api/departments",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                default:
                    return;
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
    }

    private void simulateAdminWorkload() {
        try {
            // Admin typical operations
            int operation = ThreadLocalRandom.current().nextInt(3);
            long startTime = System.currentTimeMillis();
            ResponseEntity<String> response;
            
            switch (operation) {
                case 0: // Manage permissions
                    response = restTemplate.exchange(
                            "/api/permissions/users",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 1: // System monitoring
                    response = restTemplate.exchange(
                            "/actuator/health",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                case 2: // Bulk operations
                    response = restTemplate.exchange(
                            "/api/employees?page=0&size=100",
                            HttpMethod.GET,
                            new HttpEntity<>(createAuthHeaders()),
                            String.class
                    );
                    break;
                    
                default:
                    return;
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
    }

    private void simulatePeakTimeOperation() {
        // Simulate operations that happen during peak times
        simulateRegularEmployeeWorkload();
    }

    private void simulateSustainedOperation() {
        // Simulate typical sustained operations
        int operation = ThreadLocalRandom.current().nextInt(2);
        if (operation == 0) {
            simulateRegularEmployeeWorkload();
        } else {
            simulateHRManagerWorkload();
        }
    }

    private void simulateDatabaseIntensiveOperation() {
        try {
            long startTime = System.currentTimeMillis();
            
            // Database intensive operations
            ResponseEntity<String> response = restTemplate.exchange(
                    "/api/employees/search?name=&departmentId=&page=0&size=50",
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
    }

    private void createLargeDataset() {
        // Create a large dataset for stress testing
        for (int i = 0; i < 500; i++) {
            createEmployee(
                    "LOAD" + String.format("%04d", i),
                    "Load Test Employee " + i,
                    "loadtest" + i + "@example.com",
                    "+123456" + i,
                    testDepartment,
                    testPosition
            );
        }
    }

    private Employee createTestEmployee() {
        Employee employee = new Employee();
        int random = ThreadLocalRandom.current().nextInt(10000);
        employee.setEmployeeNumber("LOAD" + random);
        employee.setName("Load Test Employee " + random);
        employee.setEmail("loadtest" + random + "@example.com");
        employee.setPhone("+123456" + random);
        employee.setDepartment(testDepartment);
        employee.setPosition(testPosition);
        employee.setHireDate(LocalDate.now());
        employee.setStatus(Employee.EmployeeStatus.ACTIVE);
        return employee;
    }
}