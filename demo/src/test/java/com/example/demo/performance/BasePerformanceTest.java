package com.example.demo.performance;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Position;
import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.PositionRepository;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Base class for performance tests providing common setup and utilities
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public abstract class BasePerformanceTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @LocalServerPort
    protected int port;

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected RoleRepository roleRepository;

    @Autowired
    protected ResourceRepository resourceRepository;

    @Autowired
    protected DepartmentRepository departmentRepository;

    @Autowired
    protected PositionRepository positionRepository;

    @Autowired
    protected EmployeeRepository employeeRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    // Test data
    protected User testUser;
    protected Role testRole;
    protected Department testDepartment;
    protected Position testPosition;
    protected String authToken;

    // Performance metrics
    protected AtomicInteger successCount = new AtomicInteger(0);
    protected AtomicInteger errorCount = new AtomicInteger(0);
    protected AtomicLong totalResponseTime = new AtomicLong(0);
    protected AtomicLong minResponseTime = new AtomicLong(Long.MAX_VALUE);
    protected AtomicLong maxResponseTime = new AtomicLong(0);

    @BeforeEach
    void setUpPerformanceTest() {
        setupTestData();
        authenticateTestUser();
        resetMetrics();
    }

    protected void setupTestData() {
        // Clean existing data
        employeeRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        resourceRepository.deleteAll();
        positionRepository.deleteAll();

        // Create test resources
        Resource employeeResource = createResource("EMPLOYEE_READ", "/api/employees", "GET");
        Resource departmentResource = createResource("DEPARTMENT_READ", "/api/departments", "GET");

        // Create test role
        Set<Resource> resources = new HashSet<>();
        resources.add(employeeResource);
        resources.add(departmentResource);
        testRole = createRole("PERFORMANCE_TEST_ROLE", "Performance Test Role", resources);

        // Create test user
        Set<Role> roles = new HashSet<>();
        roles.add(testRole);
        testUser = createUser("perftest", "perftest@example.com", "password", roles);

        // Create test department
        testDepartment = createDepartment("Performance Test Department", null, null, false);

        // Create test position
        testPosition = createPosition("Performance Test Position", "Test Position", testDepartment);
    }

    protected void authenticateTestUser() {
        // In a real implementation, you would authenticate and get a JWT token
        // For this test, we'll simulate authentication
        authToken = "Bearer test-token";
    }

    protected void resetMetrics() {
        successCount.set(0);
        errorCount.set(0);
        totalResponseTime.set(0);
        minResponseTime.set(Long.MAX_VALUE);
        maxResponseTime.set(0);
    }

    protected HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth("test-token");
        return headers;
    }

    protected void recordResponseTime(long responseTime) {
        totalResponseTime.addAndGet(responseTime);
        minResponseTime.updateAndGet(current -> Math.min(current, responseTime));
        maxResponseTime.updateAndGet(current -> Math.max(current, responseTime));
    }

    protected PerformanceMetrics calculateMetrics(int totalRequests, long totalDuration) {
        double averageResponseTime = totalResponseTime.get() / (double) totalRequests;
        double throughput = totalRequests / (totalDuration / 1000.0); // requests per second
        double successRate = (successCount.get() / (double) totalRequests) * 100;

        return new PerformanceMetrics(
                totalRequests,
                successCount.get(),
                errorCount.get(),
                averageResponseTime,
                minResponseTime.get(),
                maxResponseTime.get(),
                throughput,
                successRate,
                totalDuration
        );
    }

    protected void runConcurrentTest(Runnable task, int threadCount, int requestsPerThread) throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                for (int j = 0; j < requestsPerThread; j++) {
                    try {
                        task.run();
                    } catch (Exception e) {
                        errorCount.incrementAndGet();
                    }
                }
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.MINUTES);
        
        long endTime = System.currentTimeMillis();
        long totalDuration = endTime - startTime;
        
        PerformanceMetrics metrics = calculateMetrics(threadCount * requestsPerThread, totalDuration);
        printMetrics(metrics);
    }

    protected void printMetrics(PerformanceMetrics metrics) {
        System.out.println("=== Performance Test Results ===");
        System.out.println("Total Requests: " + metrics.totalRequests);
        System.out.println("Successful Requests: " + metrics.successCount);
        System.out.println("Failed Requests: " + metrics.errorCount);
        System.out.println("Success Rate: " + String.format("%.2f%%", metrics.successRate));
        System.out.println("Average Response Time: " + String.format("%.2f ms", metrics.averageResponseTime));
        System.out.println("Min Response Time: " + metrics.minResponseTime + " ms");
        System.out.println("Max Response Time: " + metrics.maxResponseTime + " ms");
        System.out.println("Throughput: " + String.format("%.2f requests/sec", metrics.throughput));
        System.out.println("Total Duration: " + metrics.totalDuration + " ms");
        System.out.println("================================");
    }

    // Helper methods for creating test data
    protected Resource createResource(String name, String url, String method) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setUrl(url);
        resource.setMethod(method);
        resource.setDescription("Performance test resource: " + name);
        return resourceRepository.save(resource);
    }

    protected Role createRole(String name, String description, Set<Resource> resources) {
        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        role.setResources(resources);
        return roleRepository.save(role);
    }

    protected User createUser(String username, String email, String password, Set<Role> roles) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);
        user.setRoles(roles);
        return userRepository.save(user);
    }

    protected Department createDepartment(String name, Long parentId, String depPath, boolean isParent) {
        Department department = new Department();
        department.setName(name);
        department.setParentId(parentId);
        department.setIsParent(isParent);
        Department savedDepartment = departmentRepository.save(department);
        
        if (parentId != null) {
            Department parent = departmentRepository.findById(parentId).orElse(null);
            if (parent != null) {
                savedDepartment.setDepPath(parent.getDepPath() + savedDepartment.getId() + "/");
            }
        } else {
            savedDepartment.setDepPath("/" + savedDepartment.getId() + "/");
        }
        
        return departmentRepository.save(savedDepartment);
    }

    protected Position createPosition(String jobTitle, String professionalTitle, Department department) {
        Position position = new Position();
        position.setJobTitle(jobTitle);
        position.setProfessionalTitle(professionalTitle);
        position.setDescription("Performance test position");
        position.setDepartment(department);
        return positionRepository.save(position);
    }

    protected Employee createEmployee(String employeeNumber, String name, String email, 
                                    String phone, Department department, Position position) {
        Employee employee = new Employee();
        employee.setEmployeeNumber(employeeNumber);
        employee.setName(name);
        employee.setEmail(email);
        employee.setPhone(phone);
        employee.setDepartment(department);
        employee.setPosition(position);
        employee.setHireDate(LocalDate.now());
        employee.setStatus(Employee.EmployeeStatus.ACTIVE);
        return employeeRepository.save(employee);
    }

    // Performance metrics data class
    public static class PerformanceMetrics {
        public final int totalRequests;
        public final int successCount;
        public final int errorCount;
        public final double averageResponseTime;
        public final long minResponseTime;
        public final long maxResponseTime;
        public final double throughput;
        public final double successRate;
        public final long totalDuration;

        public PerformanceMetrics(int totalRequests, int successCount, int errorCount,
                                double averageResponseTime, long minResponseTime, long maxResponseTime,
                                double throughput, double successRate, long totalDuration) {
            this.totalRequests = totalRequests;
            this.successCount = successCount;
            this.errorCount = errorCount;
            this.averageResponseTime = averageResponseTime;
            this.minResponseTime = minResponseTime;
            this.maxResponseTime = maxResponseTime;
            this.throughput = throughput;
            this.successRate = successRate;
            this.totalDuration = totalDuration;
        }
    }
}