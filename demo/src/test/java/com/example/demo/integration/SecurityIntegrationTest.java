//not pass

package com.example.demo.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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

/**
 * Integration tests for Security and Role-Based Access Control
 * Tests authentication, authorization, and permission enforcement
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private ResourceRepository resourceRepository;
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private PositionRepository positionRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private User adminUser;
    private User hrUser;
    private User employeeUser;
    private Role adminRole;
    private Role hrRole;
    private Role employeeRole;
    private Resource employeeResource;
    private Resource departmentResource;
    private Resource payrollResource;
    private Department testDepartment;
    private Position testPosition;
    private Employee testEmployee;
    
    @BeforeEach
    void setUp() {
        // Clean up existing data
        userRepository.deleteAll();
        roleRepository.deleteAll();
        resourceRepository.deleteAll();
        employeeRepository.deleteAll();
        positionRepository.deleteAll();
        departmentRepository.deleteAll();
        
        // Create test resources
        employeeResource = new Resource();
        employeeResource.setName("EMPLOYEE_MANAGEMENT");
        employeeResource.setUrl("/api/employees/**");
        employeeResource.setMethod("*");
        employeeResource.setDescription("Employee management operations");
        employeeResource = resourceRepository.save(employeeResource);
        
        departmentResource = new Resource();
        departmentResource.setName("DEPARTMENT_MANAGEMENT");
        departmentResource.setUrl("/api/departments/**");
        departmentResource.setMethod("*");
        departmentResource.setDescription("Department management operations");
        departmentResource = resourceRepository.save(departmentResource);
        
        payrollResource = new Resource();
        payrollResource.setName("PAYROLL_MANAGEMENT");
        payrollResource.setUrl("/api/payroll/**");
        payrollResource.setMethod("*");
        payrollResource.setDescription("Payroll management operations");
        payrollResource = resourceRepository.save(payrollResource);
        
        // Create test roles with different permissions
        adminRole = new Role();
        adminRole.setName("ADMIN");
        adminRole.setDescription("Administrator with full access");
        adminRole.setResources(Set.of(employeeResource, departmentResource, payrollResource));
        adminRole = roleRepository.save(adminRole);
        
        hrRole = new Role();
        hrRole.setName("HR_MANAGER");
        hrRole.setDescription("HR Manager with employee and department access");
        hrRole.setResources(Set.of(employeeResource, departmentResource));
        hrRole = roleRepository.save(hrRole);
        
        employeeRole = new Role();
        employeeRole.setName("EMPLOYEE");
        employeeRole.setDescription("Regular employee with limited access");
        employeeRole.setResources(Set.of()); // No special resources
        employeeRole = roleRepository.save(employeeRole);
        
        // Create test users with different roles
        adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setEnabled(true);
        adminUser.setRoles(Set.of(adminRole));
        adminUser = userRepository.save(adminUser);
        
        hrUser = new User();
        hrUser.setUsername("hrmanager");
        hrUser.setEmail("hr@example.com");
        hrUser.setPassword(passwordEncoder.encode("hr123"));
        hrUser.setEnabled(true);
        hrUser.setRoles(Set.of(hrRole));
        hrUser = userRepository.save(hrUser);
        
        employeeUser = new User();
        employeeUser.setUsername("employee");
        employeeUser.setEmail("employee@example.com");
        employeeUser.setPassword(passwordEncoder.encode("emp123"));
        employeeUser.setEnabled(true);
        employeeUser.setRoles(Set.of(employeeRole));
        employeeUser = userRepository.save(employeeUser);
        
        // Create test data
        testDepartment = new Department();
        testDepartment.setName("Test Department");
        testDepartment.setDepPath("/Test");
        testDepartment.setIsParent(false);
        testDepartment = departmentRepository.save(testDepartment);
        
        testPosition = new Position();
        testPosition.setJobTitle("Test Position");
        testPosition.setProfessionalTitle("Test Title");
        testPosition.setDescription("Test position description");
        testPosition = positionRepository.save(testPosition);
        
        testEmployee = new Employee();
        testEmployee.setEmployeeNumber("TEST001");
        testEmployee.setName("Test Employee");
        testEmployee.setEmail("test@example.com");
        testEmployee.setDepartment(testDepartment);
        testEmployee.setPosition(testPosition);
        testEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);
        testEmployee = employeeRepository.save(testEmployee);
    }
    
    @Test
    @WithMockUser(username = "admin", authorities = {"EMPLOYEE_READ", "EMPLOYEE_CREATE", "EMPLOYEE_UPDATE", "EMPLOYEE_DELETE"})
    void testAdminCanAccessAllEmployeeOperations() throws Exception {
        // Admin can read employees
        mockMvc.perform(get("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
        
        // Admin can create employees
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("ADMIN001");
        newEmployee.setName("Admin Created Employee");
        newEmployee.setEmail("admin.created@example.com");
        newEmployee.setDepartment(testDepartment);
        newEmployee.setPosition(testPosition);
        newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);
        
        mockMvc.perform(post("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated());
        
        // Admin can update employees
        testEmployee.setName("Updated by Admin");
        mockMvc.perform(put("/api/employees/" + testEmployee.getId())
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testEmployee)))
                .andExpect(status().isOk());
        
        // Admin can delete employees
        mockMvc.perform(delete("/api/employees/" + testEmployee.getId())
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());
    }
    
    @Test
    @WithMockUser(username = "hrmanager", authorities = {"EMPLOYEE_READ", "EMPLOYEE_CREATE", "EMPLOYEE_UPDATE", "DEPARTMENT_READ"})
    void testHRManagerCanAccessEmployeeAndDepartmentOperations() throws Exception {
        // HR Manager can read employees
        mockMvc.perform(get("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
        
        // HR Manager can read departments
        mockMvc.perform(get("/api/departments")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
        
        // HR Manager can create employees
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("HR001");
        newEmployee.setName("HR Created Employee");
        newEmployee.setEmail("hr.created@example.com");
        newEmployee.setDepartment(testDepartment);
        newEmployee.setPosition(testPosition);
        newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);
        
        mockMvc.perform(post("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated());
    }
    
    @Test
    @WithMockUser(username = "hrmanager", authorities = {"EMPLOYEE_READ", "EMPLOYEE_CREATE", "EMPLOYEE_UPDATE", "DEPARTMENT_READ"})
    void testHRManagerCannotAccessPayroll() throws Exception {
        // HR Manager cannot access payroll operations
        mockMvc.perform(get("/api/payroll")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(username = "employee", authorities = {"PROFILE_READ"})
    void testEmployeeHasLimitedAccess() throws Exception {
        // Employee cannot read all employees
        mockMvc.perform(get("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
        
        // Employee cannot create employees
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("EMP001");
        newEmployee.setName("Employee Created");
        newEmployee.setEmail("emp.created@example.com");
        newEmployee.setDepartment(testDepartment);
        newEmployee.setPosition(testPosition);
        newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);
        
        mockMvc.perform(post("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isForbidden());
        
        // Employee cannot access departments
        mockMvc.perform(get("/api/departments")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
        
        // Employee cannot access payroll
        mockMvc.perform(get("/api/payroll")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void testUnauthenticatedAccessDenied() throws Exception {
        // Unauthenticated users cannot access any protected endpoints
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isForbidden());
        
        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isForbidden());
        
        mockMvc.perform(get("/api/payroll"))
                .andExpect(status().isForbidden());
        
        mockMvc.perform(get("/api/permissions/roles"))
                .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(username = "admin", authorities = {"PERMISSION_READ", "PERMISSION_CREATE", "PERMISSION_UPDATE", "PERMISSION_DELETE"})
    void testAdminCanManagePermissions() throws Exception {
        // Admin can read roles
        mockMvc.perform(get("/api/permissions/roles")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3));
        
        // Admin can create new role
        Role newRole = new Role();
        newRole.setName("MANAGER");
        newRole.setDescription("Department Manager");
        
        mockMvc.perform(post("/api/permissions/roles")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRole)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("MANAGER"));
        
        // Admin can assign roles to users
        mockMvc.perform(post("/api/permissions/users/" + employeeUser.getId() + "/roles/" + hrRole.getId())
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }
    
    @Test
    @WithMockUser(username = "hrmanager", authorities = {"EMPLOYEE_READ"})
    void testHRManagerCannotManagePermissions() throws Exception {
        // HR Manager cannot access permission management
        mockMvc.perform(get("/api/permissions/roles")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
        
        // HR Manager cannot create roles
        Role newRole = new Role();
        newRole.setName("MANAGER");
        newRole.setDescription("Department Manager");
        
        mockMvc.perform(post("/api/permissions/roles")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRole)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(username = "admin", authorities = {"EMPLOYEE_READ", "DEPARTMENT_READ", "PAYROLL_READ"})
    void testCrossModulePermissions() throws Exception {
        // Admin with proper permissions can access all modules
        mockMvc.perform(get("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
        
        mockMvc.perform(get("/api/departments")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
        
        mockMvc.perform(get("/api/payroll")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
    }
    
    @Test
    @WithMockUser(username = "testuser", authorities = {"EMPLOYEE_READ"})
    void testMethodLevelSecurity() throws Exception {
        // Test that method-level security annotations are enforced
        mockMvc.perform(get("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk());
        
        // Test that insufficient permissions are denied
        mockMvc.perform(post("/api/employees")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testEmployee)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    @WithMockUser(username = "admin", authorities = {"EMPLOYEE_READ"})
    void testResourceBasedPermissions() throws Exception {
        // Test that resource-based permissions work correctly
        mockMvc.perform(get("/api/employees/" + testEmployee.getId())
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeNumber").value("TEST001"));
        
        // Test that accessing non-existent resource returns appropriate error
        mockMvc.perform(get("/api/employees/99999")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNotFound());
    }
}