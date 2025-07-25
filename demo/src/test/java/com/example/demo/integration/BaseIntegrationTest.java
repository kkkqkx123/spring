package com.example.demo.integration;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
// DynamicPropertyRegistry imports removed - using static test configuration instead
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
// Testcontainers imports removed - using embedded test configuration instead

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
public abstract class BaseIntegrationTest {

    // Redis container removed - using embedded test configuration instead

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

    // Test data
    protected User adminUser;
    protected User hrManagerUser;
    protected User regularUser;
    protected Role adminRole;
    protected Role hrManagerRole;
    protected Role userRole;
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
        roleRepository.deleteAll();
        resourceRepository.deleteAll();
        departmentRepository.deleteAll();
        positionRepository.deleteAll();

        // Create resources
        Resource employeeReadResource = createResource("EMPLOYEE_READ", "/api/employees", "GET");
        Resource employeeCreateResource = createResource("EMPLOYEE_CREATE", "/api/employees", "POST");
        Resource employeeUpdateResource = createResource("EMPLOYEE_UPDATE", "/api/employees/*", "PUT");
        Resource employeeDeleteResource = createResource("EMPLOYEE_DELETE", "/api/employees/*", "DELETE");
        Resource departmentReadResource = createResource("DEPARTMENT_READ", "/api/departments", "GET");
        Resource departmentCreateResource = createResource("DEPARTMENT_CREATE", "/api/departments", "POST");
        Resource positionReadResource = createResource("POSITION_READ", "/api/positions", "GET");
        Resource positionCreateResource = createResource("POSITION_CREATE", "/api/positions", "POST");
        Resource payrollReadResource = createResource("PAYROLL_READ", "/api/payroll", "GET");
        Resource payrollCreateResource = createResource("PAYROLL_CREATE", "/api/payroll", "POST");

        // Create roles
        Set<Resource> adminResources = new HashSet<>();
        adminResources.addAll(Set.of(
                employeeReadResource, employeeCreateResource, employeeUpdateResource, employeeDeleteResource,
                departmentReadResource, departmentCreateResource,
                positionReadResource, positionCreateResource,
                payrollReadResource, payrollCreateResource
        ));
        adminRole = createRole("ROLE_ADMIN", "System Administrator", adminResources);

        Set<Resource> hrManagerResources = new HashSet<>();
        hrManagerResources.addAll(Set.of(
                employeeReadResource, employeeCreateResource, employeeUpdateResource, employeeDeleteResource,
                departmentReadResource, positionReadResource,
                payrollReadResource, payrollCreateResource
        ));
        hrManagerRole = createRole("ROLE_HR_MANAGER", "HR Manager", hrManagerResources);

        Set<Resource> userResources = new HashSet<>();
        userResources.addAll(Set.of(
                employeeReadResource, departmentReadResource, positionReadResource
        ));
        userRole = createRole("ROLE_USER", "Regular User", userResources);

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

        // Create departments
        itDepartment = createDepartment("IT Department", null, "/IT", true);
        hrDepartment = createDepartment("HR Department", null, "/HR", false);

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
        department.setDepPath(depPath);
        department.setIsParent(isParent);
        return departmentRepository.save(department);
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