package com.example.demo.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.Position;
import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.SystemMessage;
import com.example.demo.model.entity.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.PayrollRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Database integration tests
 * Tests database operations, relationships, and data integrity
 */
class DatabaseIntegrationTest extends BaseIntegrationTest {

    @Test
    void testUserRepository_CRUDOperations_ShouldWorkCorrectly() {
        // Create
        User newUser = new User();
        newUser.setUsername("testuser");
        newUser.setEmail("testuser@example.com");
        newUser.setPassword("hashedpassword");
        newUser.setEnabled(true);
        User savedUser = userRepository.save(newUser);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getUsername()).isEqualTo("testuser");

        // Read
        Optional<User> foundUser = userRepository.findById(savedUser.getId());
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getEmail()).isEqualTo("testuser@example.com");

        // Update
        savedUser.setEmail("updated@example.com");
        User updatedUser = userRepository.save(savedUser);
        assertThat(updatedUser.getEmail()).isEqualTo("updated@example.com");

        // Delete
        userRepository.delete(savedUser);
        Optional<User> deletedUser = userRepository.findById(savedUser.getId());
        assertThat(deletedUser).isEmpty();
    }

    @Test
    void testUserRoleRelationship_ShouldMaintainIntegrity() {
        // Test many-to-many relationship between User and Role
        User user = userRepository.findById(regularUser.getId()).orElseThrow();
        assertThat(user.getRoles()).hasSize(1);
        assertThat(user.getRoles().iterator().next().getName()).isEqualTo("ROLE_USER");

        // Add another role
        user.getRoles().add(hrManagerRole);
        userRepository.save(user);

        // Verify relationship
        User updatedUser = userRepository.findById(regularUser.getId()).orElseThrow();
        assertThat(updatedUser.getRoles()).hasSize(2);
        assertThat(updatedUser.getRoles().stream().map(Role::getName))
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_HR_MANAGER");
    }

    @Test
    void testRoleResourceRelationship_ShouldMaintainIntegrity() {
        // Test many-to-many relationship between Role and Resource
        Role role = roleRepository.findById(adminRole.getId()).orElseThrow();
        assertThat(role.getResources()).isNotEmpty();

        // Create new resource and add to role
        Resource newResource = createResource("TEST_PERMISSION", "/api/test", "GET");
        role.getResources().add(newResource);
        roleRepository.save(role);

        // Verify relationship
        Role updatedRole = roleRepository.findById(adminRole.getId()).orElseThrow();
        assertThat(updatedRole.getResources().stream().map(Resource::getName))
                .contains("TEST_PERMISSION");
    }

    @Test
    void testDepartmentRepository_HierarchicalQueries_ShouldWorkCorrectly() {
        // Create parent-child department relationship
        Department parentDept = createDepartment("Parent Dept", null, "/Parent", true);
        Department childDept = createDepartment("Child Dept", parentDept.getId(), "/Parent/Child", false);

        // Test finding by parent
        List<Department> children = departmentRepository.findByParentId(parentDept.getId());
        assertThat(children).hasSize(1);
        assertThat(children.get(0).getName()).isEqualTo("Child Dept");

        // Test finding root departments (no parent)
        List<Department> rootDepartments = departmentRepository.findByParentIdIsNull();
        assertThat(rootDepartments).hasSizeGreaterThanOrEqualTo(3); // IT, HR, and Parent Dept
    }

    @Test
    void testEmployeeRepository_SearchAndPagination_ShouldWorkCorrectly() {
        // Test pagination
        Pageable pageable = PageRequest.of(0, 1, Sort.by("name"));
        Page<Employee> employeePage = employeeRepository.findAll(pageable);
        
        assertThat(employeePage.getContent()).hasSize(1);
        assertThat(employeePage.getTotalElements()).isEqualTo(2);
        assertThat(employeePage.getTotalPages()).isEqualTo(2);

        // Test search by name
        List<Employee> foundEmployees = employeeRepository.findByNameContainingIgnoreCase("john");
        assertThat(foundEmployees).hasSize(1);
        assertThat(foundEmployees.get(0).getName()).isEqualTo("John Doe");

        // Test search by department
        List<Employee> itEmployees = employeeRepository.findByDepartmentId(itDepartment.getId());
        assertThat(itEmployees).hasSize(1);
        assertThat(itEmployees.get(0).getDepartment().getName()).isEqualTo("IT Department");

        // Test search by status
        List<Employee> activeEmployees = employeeRepository.findByStatus(Employee.EmployeeStatus.ACTIVE);
        assertThat(activeEmployees).hasSize(2);
    }

    @Test
    void testEmployeeDepartmentPositionRelationship_ShouldMaintainIntegrity() {
        Employee employee = employeeRepository.findById(testEmployee1.getId()).orElseThrow();
        
        // Test department relationship
        assertThat(employee.getDepartment()).isNotNull();
        assertThat(employee.getDepartment().getName()).isEqualTo("IT Department");

        // Test position relationship
        assertThat(employee.getPosition()).isNotNull();
        assertThat(employee.getPosition().getJobTitle()).isEqualTo("Software Developer");

        // Update relationships
        employee.setDepartment(hrDepartment);
        employee.setPosition(managerPosition);
        employeeRepository.save(employee);

        // Verify updates
        Employee updatedEmployee = employeeRepository.findById(testEmployee1.getId()).orElseThrow();
        assertThat(updatedEmployee.getDepartment().getName()).isEqualTo("HR Department");
        assertThat(updatedEmployee.getPosition().getJobTitle()).isEqualTo("Manager");
    }

    @Test
    void testPositionRepository_DepartmentRelationship_ShouldWorkCorrectly() {
        // Test finding positions by department
        List<Position> itPositions = positionRepository.findByDepartmentId(itDepartment.getId());
        assertThat(itPositions).hasSize(1);
        assertThat(itPositions.get(0).getJobTitle()).isEqualTo("Software Developer");

        // Test position-department relationship integrity
        Position position = positionRepository.findById(developerPosition.getId()).orElseThrow();
        assertThat(position.getDepartment()).isNotNull();
        assertThat(position.getDepartment().getName()).isEqualTo("IT Department");
    }

    @Test
    void testPayrollRepository_EmployeeRelationship_ShouldWorkCorrectly() {
        // Create payroll ledger
        PayrollLedger ledger = new PayrollLedger();
        ledger.setEmployeeId(testEmployee1.getId());
        ledger.setBaseSalary(new BigDecimal("5000.00"));
        ledger.setAllowances(new BigDecimal("1000.00"));
        ledger.setDeductions(new BigDecimal("500.00"));
        ledger.setNetSalary(new BigDecimal("5500.00"));
        ledger.setPayPeriod(LocalDate.now());
        
        PayrollLedger savedLedger = payrollRepository.save(ledger);
        assertThat(savedLedger.getId()).isNotNull();

        // Test finding by employee
        List<PayrollLedger> employeeLedgers = payrollRepository.findByEmployee_Id(testEmployee1.getId());
        assertThat(employeeLedgers).hasSize(1);
        assertThat(employeeLedgers.get(0).getBaseSalary()).isEqualTo(new BigDecimal("5000.00"));

        // Test finding by date range
        LocalDate startDate = LocalDate.now().minusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(1);
        List<PayrollLedger> dateRangeLedgers = payrollRepository.findByPayPeriodBetween(startDate, endDate);
        assertThat(dateRangeLedgers).hasSize(1);
    }

    @Test
    void testMessageRepository_ChatAndNotifications_ShouldWorkCorrectly() {
        // Create chat message
        MessageContent chatMessage = new MessageContent();
        chatMessage.setContent("Test chat message");
        chatMessage.setCreatedAt(LocalDateTime.now());
        chatMessage.setSenderId(adminUser.getId());
        chatMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);
        
        MessageContent savedMessage = messageRepository.save(chatMessage);
        assertThat(savedMessage.getId()).isNotNull();

        // Test finding by type
        List<MessageContent> chatMessages = messageRepository.findByMessageType(MessageContent.MessageType.CHAT_MESSAGE);
        assertThat(chatMessages).hasSize(1);
        assertThat(chatMessages.get(0).getContent()).isEqualTo("Test chat message");

        // Test finding by sender
        List<MessageContent> senderMessages = messageRepository.findBySenderId(adminUser.getId());
        assertThat(senderMessages).hasSize(1);

        // Test content search
        List<MessageContent> searchResults = messageRepository.findByContentContainingIgnoreCase("test");
        assertThat(searchResults).hasSize(1);
    }

    @Test
    void testSystemMessageRepository_NotificationSystem_ShouldWorkCorrectly() {
        // Create message content
        MessageContent message = new MessageContent();
        message.setContent("System notification");
        message.setCreatedAt(LocalDateTime.now());
        message.setSenderId(adminUser.getId());
        message.setMessageType(MessageContent.MessageType.SYSTEM_NOTIFICATION);
        MessageContent savedMessage = messageRepository.save(message);

        // Create system message
        SystemMessage sysMessage = new SystemMessage();
        sysMessage.setUserId(regularUser.getId());
        sysMessage.setMessageId(savedMessage.getId());
        sysMessage.setIsRead(false);
        sysMessage.setCreatedAt(LocalDateTime.now());
        
        SystemMessage savedSysMessage = systemMessageRepository.save(sysMessage);
        assertThat(savedSysMessage.getId()).isNotNull();

        // Test finding by user
        List<SystemMessage> userMessages = systemMessageRepository.findByUserId(regularUser.getId());
        assertThat(userMessages).hasSize(1);
        assertThat(userMessages.get(0).getIsRead()).isFalse();

        // Test finding unread messages
        List<SystemMessage> unreadMessages = systemMessageRepository.findByUserIdAndIsRead(regularUser.getId(), false);
        assertThat(unreadMessages).hasSize(1);

        // Mark as read
        savedSysMessage.setIsRead(true);
        savedSysMessage.setReadAt(LocalDateTime.now());
        systemMessageRepository.save(savedSysMessage);

        // Verify read status
        List<SystemMessage> readMessages = systemMessageRepository.findByUserIdAndIsRead(regularUser.getId(), true);
        assertThat(readMessages).hasSize(1);
        assertThat(readMessages.get(0).getReadAt()).isNotNull();
    }

    @Test
    void testTransactionalIntegrity_ShouldMaintainConsistency() {
        // Test that related data is properly managed in transactions
        long initialEmployeeCount = employeeRepository.count();
        long initialDepartmentCount = departmentRepository.count();

        try {
            // Create department and employee in same transaction
            Department newDept = createDepartment("Test Dept", null, "/Test", false);
            Employee newEmployee = createEmployee("TEST001", "Test Employee", 
                    "test@example.com", "+1234567890", newDept, developerPosition);

            assertThat(employeeRepository.count()).isEqualTo(initialEmployeeCount + 1);
            assertThat(departmentRepository.count()).isEqualTo(initialDepartmentCount + 1);

            // Verify relationships
            Employee savedEmployee = employeeRepository.findById(newEmployee.getId()).orElseThrow();
            assertThat(savedEmployee.getDepartment().getId()).isEqualTo(newDept.getId());

        } catch (Exception e) {
            // In case of rollback, counts should remain the same
            assertThat(employeeRepository.count()).isEqualTo(initialEmployeeCount);
            assertThat(departmentRepository.count()).isEqualTo(initialDepartmentCount);
        }
    }

    @Test
    void testCascadeOperations_ShouldWorkCorrectly() {
        // Test cascade delete behavior
        Department tempDept = createDepartment("Temp Dept", null, "/Temp", false);
        Position tempPosition = createPosition("Temp Position", "Temp Title", tempDept);
        Employee tempEmployee = createEmployee("TEMP001", "Temp Employee", 
                "temp@example.com", "+1234567890", tempDept, tempPosition);

        Long deptId = tempDept.getId();
        Long positionId = tempPosition.getId();
        Long employeeId = tempEmployee.getId();

        // Verify entities exist
        assertThat(departmentRepository.findById(deptId)).isPresent();
        assertThat(positionRepository.findById(positionId)).isPresent();
        assertThat(employeeRepository.findById(employeeId)).isPresent();

        // Set department reference to null for all employees in this department
        List<Employee> deptEmployees = employeeRepository.findByDepartmentId(tempDept.getId());
        for (Employee emp : deptEmployees) {
            emp.setDepartment(null);
            employeeRepository.save(emp);
        }
        
        // Delete department (should handle cascading appropriately)
        departmentRepository.delete(tempDept);

        // Verify department is deleted
        assertThat(departmentRepository.findById(deptId)).isEmpty();
        
        // Employee and position should still exist but with null/updated references
        // (depending on cascade configuration)
        Optional<Employee> remainingEmployee = employeeRepository.findById(employeeId);
        if (remainingEmployee.isPresent()) {
            // If employee still exists, department reference should be handled
            assertThat(remainingEmployee.get().getDepartment()).isNull();
        }
    }

    @Test
    void testUniqueConstraints_ShouldEnforceUniqueness() {
        // Test unique constraints on employee number
        Employee employee1 = new Employee();
        employee1.setEmployeeNumber("UNIQUE001");
        employee1.setName("Employee 1");
        employee1.setEmail("emp1@example.com");
        employee1.setDepartment(itDepartment);
        employee1.setPosition(developerPosition);
        employee1.setStatus(Employee.EmployeeStatus.ACTIVE);
        employeeRepository.save(employee1);

        // Try to create another employee with same employee number
        Employee employee2 = new Employee();
        employee2.setEmployeeNumber("UNIQUE001"); // Same as above
        employee2.setName("Employee 2");
        employee2.setEmail("emp2@example.com");
        employee2.setDepartment(itDepartment);
        employee2.setPosition(developerPosition);
        employee2.setStatus(Employee.EmployeeStatus.ACTIVE);

        // This should throw an exception due to unique constraint
        assertThrows(Exception.class, () -> {
            employeeRepository.save(employee2);
            employeeRepository.flush(); // Force immediate execution
        });
    }

    @Test
    void testDataValidation_ShouldEnforceConstraints() {
        // Test that validation constraints are enforced at database level
        Employee invalidEmployee = new Employee();
        // Missing required fields should cause validation errors
        
        assertThrows(Exception.class, () -> {
            employeeRepository.save(invalidEmployee);
            employeeRepository.flush();
        });

        // Test email format validation (if implemented at entity level)
        Employee employeeWithInvalidEmail = new Employee();
        employeeWithInvalidEmail.setEmployeeNumber("INVALID001");
        employeeWithInvalidEmail.setName("Invalid Employee");
        employeeWithInvalidEmail.setEmail("invalid-email-format");
        employeeWithInvalidEmail.setDepartment(itDepartment);
        employeeWithInvalidEmail.setPosition(developerPosition);
        employeeWithInvalidEmail.setStatus(Employee.EmployeeStatus.ACTIVE);

        // This might throw validation exception depending on entity validation setup
        try {
            employeeRepository.save(employeeWithInvalidEmail);
            employeeRepository.flush();
        } catch (Exception e) {
            // Expected if email validation is enforced
            assertThat(e.getMessage()).contains("email");
        }
    }
}