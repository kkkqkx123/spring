package com.example.demo.performance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import com.example.demo.model.entity.Employee;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Performance tests for Employee management endpoints
 */
@DisplayName("Employee Performance Tests")
class EmployeePerformanceTest extends BasePerformanceTest {

    private List<Employee> testEmployees;

    @BeforeEach
    void setupEmployeePerformanceTest() {
        // Create a large dataset for performance testing
        createLargeEmployeeDataset(1000);
    }

    @Test
    @DisplayName("Should handle high load on employee list endpoint")
    void testEmployeeListPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/employees?page=0&size=20",
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

        // Test with 50 concurrent threads, 10 requests each
        runConcurrentTest(task, 50, 10);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(500, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 1000, "Average response time should be less than 1 second");
        assertTrue(metrics.successRate > 95, "Success rate should be above 95%");
        assertTrue(metrics.throughput > 10, "Throughput should be above 10 requests/sec");
    }

    @Test
    @DisplayName("Should handle concurrent employee creation")
    void testEmployeeCreationPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                Employee newEmployee = createTestEmployee();
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/employees",
                        HttpMethod.POST,
                        new HttpEntity<>(newEmployee, createAuthHeaders()),
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

        // Test with 20 concurrent threads, 5 requests each
        runConcurrentTest(task, 20, 5);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(100, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 2000, "Average response time should be less than 2 seconds");
        assertTrue(metrics.successRate > 90, "Success rate should be above 90%");
    }

    @Test
    @DisplayName("Should handle employee search performance")
    void testEmployeeSearchPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                String searchQuery = "name=Test&page=0&size=10";
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/employees/search?" + searchQuery,
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

        // Test with 30 concurrent threads, 10 requests each
        runConcurrentTest(task, 30, 10);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(300, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 1500, "Average response time should be less than 1.5 seconds");
        assertTrue(metrics.successRate > 95, "Success rate should be above 95%");
    }

    @Test
    @DisplayName("Should handle employee update performance")
    void testEmployeeUpdatePerformance() throws InterruptedException {
        // Ensure we have employees to update
        if (testEmployees.isEmpty()) {
            createLargeEmployeeDataset(100);
        }

        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                Employee employee = testEmployees.get(ThreadLocalRandom.current().nextInt(testEmployees.size()));
                employee.setName("Updated " + employee.getName());
                
                ResponseEntity<String> response = restTemplate.exchange(
                        "/api/employees/" + employee.getId(),
                        HttpMethod.PUT,
                        new HttpEntity<>(employee, createAuthHeaders()),
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

        // Test with 25 concurrent threads, 4 requests each
        runConcurrentTest(task, 25, 4);
        
        // Verify performance criteria
        PerformanceMetrics metrics = calculateMetrics(100, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 2000, "Average response time should be less than 2 seconds");
        assertTrue(metrics.successRate > 90, "Success rate should be above 90%");
    }

    @Test
    @DisplayName("Should handle Excel export performance")
    void testExcelExportPerformance() throws InterruptedException {
        Runnable task = () -> {
            long startTime = System.currentTimeMillis();
            try {
                ResponseEntity<byte[]> response = restTemplate.exchange(
                        "/api/employees/export",
                        HttpMethod.POST,
                        new HttpEntity<>("[]", createAuthHeaders()),
                        byte[].class
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

        // Test with 10 concurrent threads, 3 requests each (Excel export is resource intensive)
        runConcurrentTest(task, 10, 3);
        
        // Verify performance criteria (more lenient for Excel export)
        PerformanceMetrics metrics = calculateMetrics(30, totalResponseTime.get());
        assertTrue(metrics.averageResponseTime < 5000, "Average response time should be less than 5 seconds");
        assertTrue(metrics.successRate > 85, "Success rate should be above 85%");
    }

    private void createLargeEmployeeDataset(int count) {
        testEmployees = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            Employee employee = createEmployee(
                    "PERF" + String.format("%04d", i),
                    "Test Employee " + i,
                    "test" + i + "@example.com",
                    "+123456789" + i,
                    testDepartment,
                    testPosition
            );
            testEmployees.add(employee);
        }
    }

    private Employee createTestEmployee() {
        Employee employee = new Employee();
        int random = ThreadLocalRandom.current().nextInt(10000);
        employee.setEmployeeNumber("PERF" + random);
        employee.setName("Performance Test Employee " + random);
        employee.setEmail("perftest" + random + "@example.com");
        employee.setPhone("+123456" + random);
        employee.setDepartment(testDepartment);
        employee.setPosition(testPosition);
        employee.setHireDate(LocalDate.now());
        employee.setStatus(Employee.EmployeeStatus.ACTIVE);
        return employee;
    }
}