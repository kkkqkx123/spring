package com.example.demo.integration;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
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
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.PayrollRepository;
import com.example.demo.repository.PositionRepository;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.SystemMessageRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Base class for integration tests providing common setup and test data
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Testcontainers
public abstract class BaseIntegrationTest {

    @SuppressWarnings("resource")
    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withReuse(true)
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected WebApplicationContext webApplicationContext;

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
    protected PayrollRepository payrollRepository;

    @Autowired
    protected MessageRepository messageRepository;

    @Autowired
    protected SystemMessageRepository systemMessageRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected com.example.demo.service.PermissionService permissionService;
    
    @Autowired
    protected com.example.demo.service.EmployeeService employeeService;

    // Test data
    protected User adminUser;
    protected User hrManagerUser;
    protected User regularUser;
    protected User newUser;
    protected Role adminRole;
    protected Role hrManagerRole;
    protected Role userRole;
    protected Role newUserRole;
    protected Department itDepartment;
    protected Department hrDepartment;
    protected Position developerPosition;
    protected Position managerPosition;
    protected Employee testEmployee1;
    protected Employee testEmployee2;

    @BeforeEach
    void setUpIntegrationTest() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        setupTestData();
    }

    protected void setupTestData() {
        // Clean existing data
        employeeRepository.deleteAll();
        userRepository.deleteAll();
        positionRepository.deleteAll();
        departmentRepository.deleteAll();
        roleRepository.deleteAll();
        resourceRepository.deleteAll();

        // Create resources with proper authority names
        Resource employeeReadResource = createResource("EMPLOYEE_READ", "/api/employees", "GET");
        Resource employeeCreateResource = createResource("EMPLOYEE_CREATE", "/api/employees", "POST");
        Resource employeeUpdateResource = createResource("EMPLOYEE_UPDATE", "/api/employees/*", "PUT");
        Resource employeeDeleteResource = createResource("EMPLOYEE_DELETE", "/api/employees/*", "DELETE");
        Resource departmentReadResource = createResource("DEPARTMENT_READ", "/api/departments", "GET");
        Resource departmentCreateResource = createResource("DEPARTMENT_CREATE", "/api/departments", "POST");
        Resource departmentUpdateResource = createResource("DEPARTMENT_UPDATE", "/api/departments/*", "PUT");
        Resource positionReadResource = createResource("POSITION_READ", "/api/positions", "GET");
        Resource positionCreateResource = createResource("POSITION_CREATE", "/api/positions", "POST");
        Resource payrollReadResource = createResource("PAYROLL_READ", "/api/payroll", "GET");
        Resource payrollCreateResource = createResource("PAYROLL_CREATE", "/api/payroll", "POST");
        Resource payrollUpdateResource = createResource("PAYROLL_UPDATE", "/api/payroll/*", "PUT");
        Resource payrollDeleteResource = createResource("PAYROLL_DELETE", "/api/payroll/*", "DELETE");
        Resource chatReadResource = createResource("CHAT_READ", "/api/chat", "GET");
        Resource chatCreateResource = createResource("CHAT_CREATE", "/api/chat", "POST");
        Resource chatUpdateResource = createResource("CHAT_UPDATE", "/api/chat/*", "PUT");
        Resource notificationReadResource = createResource("NOTIFICATION_READ", "/api/notifications", "GET");
        Resource notificationCreateResource = createResource("NOTIFICATION_CREATE", "/api/notifications", "POST");
        Resource emailSendResource = createResource("EMAIL_SEND", "/api/email", "POST");
        Resource registerResource = createResource("AUTH_REGISTER", "/api/auth/register", "POST");

        // Create roles
        Set<Resource> adminResources = new HashSet<>();
        adminResources.addAll(Set.of(
                employeeReadResource, employeeCreateResource, employeeUpdateResource, employeeDeleteResource,
                departmentReadResource, departmentCreateResource, departmentUpdateResource,
                positionReadResource, positionCreateResource,
                payrollReadResource, payrollCreateResource, payrollUpdateResource, payrollDeleteResource,
                chatReadResource, chatCreateResource, chatUpdateResource,
                notificationReadResource, notificationCreateResource,
                emailSendResource
        ));
        adminRole = createRole("ADMIN", "System Administrator", adminResources);

        Set<Resource> hrManagerResources = new HashSet<>();
        hrManagerResources.addAll(Set.of(
                employeeReadResource, employeeCreateResource, employeeUpdateResource, employeeDeleteResource,
                departmentReadResource, departmentCreateResource, departmentUpdateResource,
                positionReadResource, positionCreateResource,
                payrollReadResource, payrollCreateResource, payrollUpdateResource,
                emailSendResource
        ));
        hrManagerRole = createRole("HR_MANAGER", "HR Manager", hrManagerResources);

        Set<Resource> userResources = new HashSet<>();
        userResources.addAll(Set.of(
                employeeReadResource, departmentReadResource, positionReadResource,
                chatReadResource, chatCreateResource, chatUpdateResource,
                notificationReadResource
        ));
        userRole = createRole("USER", "Regular User", userResources);

        Set<Resource> newUserResources = new HashSet<>();
        userResources.addAll(Set.of(
                registerResource
        ));
        newUserRole = createRole("NEW_USER", "newUser", newUserResources);

        // Create users
        Set<Role> adminRoles = new HashSet<>();
        adminRoles.add(adminRole);
        adminUser = createUser("admin", "admin@example.com", "password", adminRoles);
        
        Set<Role> hrManagerRoles = new HashSet<>();
        hrManagerRoles.add(hrManagerRole);
        hrManagerUser = createUser("hrmanager", "hr@example.com", "password", hrManagerRoles);
        
        Set<Role> userRoles = new HashSet<>();
        userRoles.add(userRole);
        regularUser = createUser("user", "user@example.com", "password", userRoles);

        Set<Role> newUserRoles = new HashSet<>();
        userRoles.add(newUserRole);
        newUser = createUser("newUser", "existinguser@example.com", "password", newUserRoles);

        // Load permissions for users
        permissionService.loadUserPermissions(adminUser);
        permissionService.loadUserPermissions(hrManagerUser);
        permissionService.loadUserPermissions(regularUser);
        permissionService.loadUserPermissions(newUser);

        // Create departments
        itDepartment = createDepartment("IT Department", null, null, true);
        hrDepartment = createDepartment("HR Department", null, null, false);

        // Create positions
        developerPosition = createPosition("Software Developer", "Senior Developer", itDepartment);
        managerPosition = createPosition("Manager", "Department Manager", hrDepartment);

        // Create employees
        testEmployee1 = createEmployee("EMP001", "John Doe", "john.doe@example.com", 
                "+1234567890", itDepartment, developerPosition);
        testEmployee2 = createEmployee("EMP002", "Jane Smith", "jane.smith@example.com", 
                "+1234567891", hrDepartment, managerPosition);
    }

    protected Resource createResource(String name, String url, String method) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setUrl(url);
        resource.setMethod(method);
        resource.setDescription("Test resource: " + name);
        return resourceRepository.save(resource);
    }

    protected Role createRole(String name, String description, Set<Resource> resources) {
        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        role.setResources(resources);
        Role savedRole = roleRepository.save(role);
        
        // Ensure the role-resource relationships are persisted
        if (resources != null && !resources.isEmpty()) {
            savedRole.setResources(resources);
            roleRepository.save(savedRole);
        }
        
        return savedRole;
    }

    protected User createUser(String username, String email, String password, Set<Role> roles) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password)); // Use the actual password encoder
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);
        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        
        // Ensure the user-role relationships are persisted
        if (roles != null && !roles.isEmpty()) {
            savedUser.setRoles(roles);
            userRepository.save(savedUser);
        }
        
        return savedUser;
    }

    protected Department createDepartment(String name, Long parentId, String depPath, boolean isParent) {
        Department department = new Department();
        department.setName(name);
        department.setParentId(parentId);
        department.setIsParent(isParent);
        Department savedDepartment = departmentRepository.save(department);
        
        // Update depPath after save to match the actual implementation
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
        position.setDescription("Test position");
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
        employee.setHireDate(LocalDate.now().minusDays(1));
        employee.setStatus(Employee.EmployeeStatus.ACTIVE);
        return employeeRepository.save(employee);
    }
}