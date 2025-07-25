package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.dto.EmailRequest;
import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.MessageContent;
import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.Position;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * End-to-end workflow integration tests
 * Tests complete business workflows across multiple controllers
 */
class EndToEndWorkflowTest extends BaseIntegrationTest {

    @Test
    void testCompleteEmployeeOnboardingWorkflow_AsHRManager_ShouldCompleteSuccessfully() throws Exception {
        // Step 1: Create a new department
        Department newDepartment = new Department();
        newDepartment.setName("Engineering");
        newDepartment.setDepPath("/Engineering");
        newDepartment.setIsParent(false);

        String departmentResponse = mockMvc.perform(post("/api/departments")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDepartment)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Department createdDepartment = objectMapper.readValue(departmentResponse, Department.class);

        // Step 2: Create a new position in the department
        Position newPosition = new Position();
        newPosition.setJobTitle("Software Engineer");
        newPosition.setProfessionalTitle("Senior Software Engineer");
        newPosition.setDescription("Full-stack software engineer");
        newPosition.setDepartment(createdDepartment);

        String positionResponse = mockMvc.perform(post("/api/positions")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPosition)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Position createdPosition = objectMapper.readValue(positionResponse, Position.class);

        // Step 3: Create a new employee
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("EMP003");
        newEmployee.setName("Alice Johnson");
        newEmployee.setEmail("alice.johnson@example.com");
        newEmployee.setPhone("+1234567893");
        newEmployee.setDepartment(createdDepartment);
        newEmployee.setPosition(createdPosition);
        newEmployee.setHireDate(LocalDate.now());
        newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);

        String employeeResponse = mockMvc.perform(post("/api/employees")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Employee createdEmployee = objectMapper.readValue(employeeResponse, Employee.class);

        // Step 4: Create payroll ledger for the new employee
        PayrollLedger payrollLedger = new PayrollLedger();
        payrollLedger.setEmployeeId(createdEmployee.getId());
        payrollLedger.setBaseSalary(new BigDecimal("7000.00"));
        payrollLedger.setAllowances(new BigDecimal("1400.00"));
        payrollLedger.setDeductions(new BigDecimal("700.00"));
        payrollLedger.setNetSalary(new BigDecimal("7700.00"));
        payrollLedger.setPayPeriod(LocalDate.now());

        mockMvc.perform(post("/api/payroll")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payrollLedger)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId").value(createdEmployee.getId()));

        // Step 5: Send welcome email to the new employee
        EmailRequest welcomeEmail = new EmailRequest();
        welcomeEmail.setSubject("Welcome to the Company");
        welcomeEmail.setTemplate("welcome");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("employeeName", createdEmployee.getName());
        variables.put("department", createdDepartment.getName());
        variables.put("position", createdPosition.getJobTitle());
        welcomeEmail.setVariables(variables);

        mockMvc.perform(post("/api/email/send-to-employee/{employeeId}", createdEmployee.getId())
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(welcomeEmail)))
                .andExpect(status().isOk());

        // Step 6: Verify the employee can be found in search
        EmployeeSearchCriteria searchCriteria = new EmployeeSearchCriteria();
        searchCriteria.setName("Alice");

        mockMvc.perform(post("/api/employees/search")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchCriteria)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Alice Johnson"));
    }

    @Test
    void testEmployeeDataManagementWorkflow_AsAdmin_ShouldCompleteSuccessfully() throws Exception {
        // Step 1: Export existing employees
        List<Long> employeeIds = List.of(testEmployee1.getId(), testEmployee2.getId());

        mockMvc.perform(post("/api/employees/export")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(employeeIds)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", 
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

        // Step 2: Import new employees via Excel
        MockMultipartFile importFile = new MockMultipartFile(
                "file",
                "new_employees.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "mock-excel-data-with-employees".getBytes()
        );

        mockMvc.perform(multipart("/api/employees/import")
                .file(importFile)
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isCreated());

        // Step 3: Update an existing employee
        testEmployee1.setName("John Doe Updated");
        testEmployee1.setEmail("john.doe.updated@example.com");

        mockMvc.perform(put("/api/employees/{id}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testEmployee1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Doe Updated"));

        // Step 4: Send notification about the update
        MessageContent notification = new MessageContent();
        notification.setContent("Employee profile updated: " + testEmployee1.getName());
        notification.setMessageType(MessageContent.MessageType.SYSTEM_NOTIFICATION);

        mockMvc.perform(post("/api/notifications")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(notification)))
                .andExpect(status().isCreated());

        // Step 5: Verify the update is reflected in search
        EmployeeSearchCriteria searchCriteria = new EmployeeSearchCriteria();
        searchCriteria.setName("Updated");

        mockMvc.perform(post("/api/employees/search")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchCriteria)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("John Doe Updated"));
    }

    @Test
    void testPayrollProcessingWorkflow_AsAdmin_ShouldCompleteSuccessfully() throws Exception {
        // Step 1: Create payroll ledgers for all employees
        PayrollLedger ledger1 = new PayrollLedger();
        ledger1.setEmployeeId(testEmployee1.getId());
        ledger1.setBaseSalary(new BigDecimal("6000.00"));
        ledger1.setAllowances(new BigDecimal("1200.00"));
        ledger1.setDeductions(new BigDecimal("600.00"));
        ledger1.setNetSalary(new BigDecimal("6600.00"));
        ledger1.setPayPeriod(LocalDate.now());

        String ledgerResponse1 = mockMvc.perform(post("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ledger1)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        PayrollLedger createdLedger1 = objectMapper.readValue(ledgerResponse1, PayrollLedger.class);

        PayrollLedger ledger2 = new PayrollLedger();
        ledger2.setEmployeeId(testEmployee2.getId());
        ledger2.setBaseSalary(new BigDecimal("7000.00"));
        ledger2.setAllowances(new BigDecimal("1400.00"));
        ledger2.setDeductions(new BigDecimal("700.00"));
        ledger2.setNetSalary(new BigDecimal("7700.00"));
        ledger2.setPayPeriod(LocalDate.now());

        mockMvc.perform(post("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ledger2)))
                .andExpect(status().isCreated());

        // Step 2: Send payroll notification emails to all employees
        EmailRequest payrollEmail = new EmailRequest();
        payrollEmail.setRecipients(List.of(testEmployee1.getEmail(), testEmployee2.getEmail()));
        payrollEmail.setSubject("Payroll Processed");
        payrollEmail.setTemplate("payroll_notification");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("payPeriod", LocalDate.now().toString());
        variables.put("message", "Your payroll has been processed successfully");
        payrollEmail.setVariables(variables);

        mockMvc.perform(post("/api/email/send-bulk")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payrollEmail)))
                .andExpect(status().isOk());

        // Step 3: Verify payroll ledgers can be retrieved
        mockMvc.perform(get("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        // Step 4: Get payroll for specific employee
        mockMvc.perform(get("/api/payroll/employee/{employeeId}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employeeId").value(testEmployee1.getId()));

        // Step 5: Update payroll ledger if needed
        createdLedger1.setAllowances(new BigDecimal("1300.00"));
        createdLedger1.setNetSalary(new BigDecimal("6700.00"));

        mockMvc.perform(put("/api/payroll/{id}", createdLedger1.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createdLedger1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowances").value(1300.00));
    }

    @Test
    void testCommunicationWorkflow_AsRegularUser_ShouldCompleteSuccessfully() throws Exception {
        // Step 1: Send a chat message
        MessageContent chatMessage = new MessageContent();
        chatMessage.setContent("Hello everyone, this is a test message");
        chatMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);

        String chatResponse = mockMvc.perform(post("/api/chat/messages")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(chatMessage)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        MessageContent createdMessage = objectMapper.readValue(chatResponse, MessageContent.class);

        // Step 2: Retrieve chat messages
        mockMvc.perform(get("/api/chat/messages")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("Hello everyone, this is a test message"));

        // Step 3: Update the chat message
        createdMessage.setContent("Updated: Hello everyone, this is a test message");

        mockMvc.perform(put("/api/chat/messages/{id}", createdMessage.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createdMessage)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated: Hello everyone, this is a test message"));

        // Step 4: Check notifications
        mockMvc.perform(get("/api/notifications")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk());

        // Step 5: Search chat messages
        mockMvc.perform(get("/api/chat/messages/search")
                .param("query", "Updated")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("Updated: Hello everyone, this is a test message"));
    }

    @Test
    void testDepartmentReorganizationWorkflow_AsAdmin_ShouldCompleteSuccessfully() throws Exception {
        // Step 1: Create a parent department
        Department parentDept = new Department();
        parentDept.setName("Technology Division");
        parentDept.setDepPath("/Technology");
        parentDept.setIsParent(true);

        String parentResponse = mockMvc.perform(post("/api/departments")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(parentDept)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Department createdParent = objectMapper.readValue(parentResponse, Department.class);

        // Step 2: Create child departments
        Department childDept1 = new Department();
        childDept1.setName("Software Development");
        childDept1.setParentId(createdParent.getId());
        childDept1.setDepPath("/Technology/Software");
        childDept1.setIsParent(false);

        mockMvc.perform(post("/api/departments")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(childDept1)))
                .andExpect(status().isCreated());

        Department childDept2 = new Department();
        childDept2.setName("Quality Assurance");
        childDept2.setParentId(createdParent.getId());
        childDept2.setDepPath("/Technology/QA");
        childDept2.setIsParent(false);

        mockMvc.perform(post("/api/departments")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(childDept2)))
                .andExpect(status().isCreated());

        // Step 3: Verify department tree structure
        mockMvc.perform(get("/api/departments/tree")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name=='Technology Division')]").exists());

        // Step 4: Get children of parent department
        mockMvc.perform(get("/api/departments/parent/{parentId}", createdParent.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        // Step 5: Send announcement to all departments
        EmailRequest announcement = new EmailRequest();
        announcement.setSubject("Department Reorganization Complete");
        announcement.setTemplate("announcement");
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("title", "Department Reorganization");
        variables.put("content", "The Technology Division has been successfully reorganized");
        announcement.setVariables(variables);

        mockMvc.perform(post("/api/email/send-to-department/{departmentId}", createdParent.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(announcement)))
                .andExpect(status().isOk());
    }
}