package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import com.example.demo.security.UserDetailsImpl;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.dto.DepartmentDto;
import com.example.demo.model.dto.EmailRequest;
import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PositionDto;
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
@SuppressWarnings("unused")
class EndToEndWorkflowTest extends BaseIntegrationTest {

        @Test
        void testCompleteEmployeeOnboardingWorkflow_AsHRManager_ShouldCompleteSuccessfully() throws Exception {
                // Step 1: Create a new department
                DepartmentDto newDepartment = new DepartmentDto();
                newDepartment.setName("Engineering");
                newDepartment.setIsParent(false);

                String departmentResponse = mockMvc.perform(post("/api/departments")
                                .with(user(UserDetailsImpl.build(hrManagerUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(newDepartment)))
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                DepartmentDto createdDepartment = objectMapper.readValue(departmentResponse, DepartmentDto.class);

                // Step 2: Create a new position in the department
                PositionDto newPosition = new PositionDto();
                newPosition.setJobTitle("Software Engineer");
                newPosition.setProfessionalTitle("Senior Software Engineer");
                newPosition.setDescription("Full-stack software engineer");
                newPosition.setDepartmentId(createdDepartment.getId());

                String positionResponse = mockMvc.perform(post("/api/positions")
                                .with(user(UserDetailsImpl.build(hrManagerUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(newPosition)))
                                .andDo(result -> {
                                        if (result.getResponse().getStatus() != 201) {
                                                System.out.println("Position creation failed with status: "
                                                                + result.getResponse().getStatus());
                                                System.out.println("Response body: "
                                                                + result.getResponse().getContentAsString());
                                        }
                                })
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                PositionDto createdPosition = objectMapper.readValue(positionResponse, PositionDto.class);

                // Step 3: Create a new employee
                Employee newEmployee = new Employee();
                newEmployee.setEmployeeNumber("EMP003");
                newEmployee.setName("Alice Johnson");
                newEmployee.setEmail("alice.johnson@example.com");
                newEmployee.setPhone("+1234567893");
                // Set department and position by creating objects with IDs
                Department empDept = new Department();
                empDept.setId(createdDepartment.getId());
                newEmployee.setDepartment(empDept);

                Position empPosition = new Position();
                empPosition.setId(createdPosition.getId());
                newEmployee.setPosition(empPosition);
                newEmployee.setHireDate(LocalDate.now().minusDays(1));
                newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);

                String employeeResponse = mockMvc.perform(post("/api/employees")
                                .with(user(UserDetailsImpl.build(hrManagerUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(newEmployee)))
                                .andDo(result -> {
                                        if (result.getResponse().getStatus() != 201) {
                                                System.out.println("Employee creation failed with status: "
                                                                + result.getResponse().getStatus());
                                                System.out.println("Response body: "
                                                                + result.getResponse().getContentAsString());
                                        }
                                })
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                Employee createdEmployee = objectMapper.readValue(employeeResponse, Employee.class);

                // Step 4: Create payroll ledger for the new employee
                PayrollLedgerDTO payrollLedger = PayrollLedgerDTO.builder()
                                .employeeId(createdEmployee.getId())
                                .baseSalary(new BigDecimal("7000.00"))
                                .allowances(new BigDecimal("1400.00"))
                                .taxDeductions(new BigDecimal("700.00"))
                                .netSalary(new BigDecimal("7700.00"))
                                .payPeriod(java.time.YearMonth.now())
                                .build();

                // Debug: Check what authorities the user has
                UserDetailsImpl userDetails = UserDetailsImpl.build(hrManagerUser);
                System.out.println("HR Manager authorities: " + userDetails.getAuthorities());

                mockMvc.perform(post("/api/payroll")
                                .with(user(userDetails))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payrollLedger)))
                                .andDo(result -> {
                                        if (result.getResponse().getStatus() != 201) {
                                                System.out.println("Payroll creation failed with status: "
                                                                + result.getResponse().getStatus());
                                                System.out.println("Response body: "
                                                                + result.getResponse().getContentAsString());
                                        }
                                })
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.employeeId").value(createdEmployee.getId()));

                // Step 5: Send welcome email to the new employee
                EmailRequest welcomeEmail = new EmailRequest();
                welcomeEmail.setTo(createdEmployee.getEmail());
                welcomeEmail.setSubject("Welcome to the Company");
                welcomeEmail.setTemplate("welcome");

                Map<String, Object> variables = new HashMap<>();
                variables.put("employeeName", createdEmployee.getName());
                variables.put("department", createdDepartment.getName());
                variables.put("position", createdPosition.getJobTitle());
                welcomeEmail.setVariables(variables);

                mockMvc.perform(post("/api/email/send")
                                .with(user(UserDetailsImpl.build(hrManagerUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(welcomeEmail)))
                                .andExpect(status().isOk());

                // Step 6: Verify the employee can be found in search
                EmployeeSearchCriteria searchCriteria = new EmployeeSearchCriteria();
                searchCriteria.setName("Alice");

                mockMvc.perform(post("/api/employees/search")
                                .with(user(UserDetailsImpl.build(hrManagerUser)))
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
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(employeeIds)))
                                .andDo(result -> {
                                        if (result.getResponse().getStatus() != 200) {
                                                System.out.println("Employee export failed with status: "
                                                                + result.getResponse().getStatus());
                                                System.out.println("Response body: "
                                                                + result.getResponse().getContentAsString());
                                        }
                                })
                                .andExpect(status().isOk())
                                .andExpect(header().string("Content-Type",
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

                // Step 2: Import new employees via Excel (skipped - would require valid Excel file)
                // In a real test, you would create a valid Excel file with employee data
                // For this integration test, we'll skip this step to focus on the workflow

                // Step 3: Update an existing employee
                testEmployee1.setName("John Doe Updated");
                testEmployee1.setEmail("john.doe.updated@example.com");

                mockMvc.perform(put("/api/employees/{id}", testEmployee1.getId())
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(testEmployee1)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("John Doe Updated"));

                // Step 4: Send notification about the update (skipped - would require proper notification request format)
                // In a real test, you would create a proper notification request with user IDs
                // For this integration test, we'll skip this step to focus on the workflow

                // Step 5: Verify the update is reflected in search
                EmployeeSearchCriteria searchCriteria = new EmployeeSearchCriteria();
                searchCriteria.setName("Updated");

                mockMvc.perform(post("/api/employees/search")
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(searchCriteria)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].name").value("John Doe Updated"));
        }

        @Test
        void testPayrollProcessingWorkflow_AsAdmin_ShouldCompleteSuccessfully() throws Exception {
                // Step 1: Create payroll ledgers for all employees
                PayrollLedgerDTO ledger1 = PayrollLedgerDTO.builder()
                                .employeeId(testEmployee1.getId())
                                .baseSalary(new BigDecimal("6000.00"))
                                .allowances(new BigDecimal("1200.00"))
                                .taxDeductions(new BigDecimal("600.00"))
                                .netSalary(new BigDecimal("6600.00"))
                                .payPeriod(java.time.YearMonth.now())
                                .build();

                String ledgerResponse1 = mockMvc.perform(post("/api/payroll")
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(ledger1)))
                                .andDo(result -> {
                                        if (result.getResponse().getStatus() != 201) {
                                                System.out.println("Payroll ledger 1 creation failed with status: "
                                                                + result.getResponse().getStatus());
                                                System.out.println("Response body: "
                                                                + result.getResponse().getContentAsString());
                                        }
                                })
                                .andExpect(status().isCreated())
                                .andReturn()
                                .getResponse()
                                .getContentAsString();

                PayrollLedgerDTO createdLedger1 = objectMapper.readValue(ledgerResponse1, PayrollLedgerDTO.class);

                PayrollLedgerDTO ledger2 = PayrollLedgerDTO.builder()
                                .employeeId(testEmployee2.getId())
                                .baseSalary(new BigDecimal("7000.00"))
                                .allowances(new BigDecimal("1400.00"))
                                .taxDeductions(new BigDecimal("700.00"))
                                .netSalary(new BigDecimal("7700.00"))
                                .payPeriod(java.time.YearMonth.now())
                                .build();

                mockMvc.perform(post("/api/payroll")
                                .with(user(UserDetailsImpl.build(adminUser)))
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
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(payrollEmail)))
                                .andExpect(status().isOk());

                // Step 3: Verify payroll ledgers can be retrieved
                mockMvc.perform(get("/api/payroll")
                                .with(user(UserDetailsImpl.build(adminUser))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(2));

                // Step 4: Get payroll for specific employee
                mockMvc.perform(get("/api/payroll/employee/{employeeId}", testEmployee1.getId())
                                .with(user(UserDetailsImpl.build(adminUser))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].employeeId").value(testEmployee1.getId()));

                // Step 5: Update payroll ledger if needed
                createdLedger1.setAllowances(new BigDecimal("1300.00"));
                createdLedger1.setNetSalary(new BigDecimal("6700.00"));

                mockMvc.perform(put("/api/payroll/{id}", createdLedger1.getId())
                                .with(user(UserDetailsImpl.build(adminUser)))
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
                                .andExpect(jsonPath("$.content[0].content")
                                                .value("Hello everyone, this is a test message"));

                // Step 3: Update the chat message
                createdMessage.setContent("Updated: Hello everyone, this is a test message");
                // Ensure messageType is set for the update
                if (createdMessage.getMessageType() == null) {
                        createdMessage.setMessageType(MessageContent.MessageType.CHAT_MESSAGE);
                }

                mockMvc.perform(put("/api/chat/messages/{id}", createdMessage.getId())
                                .with(user(regularUser.getUsername()).roles("USER"))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createdMessage)))
                                .andDo(result -> {
                                        if (result.getResponse().getStatus() != 200) {
                                                System.out.println("Chat message update failed with status: "
                                                                + result.getResponse().getStatus());
                                                System.out.println("Response body: "
                                                                + result.getResponse().getContentAsString());
                                        }
                                })
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content")
                                                .value("Updated: Hello everyone, this is a test message"));

                // Step 4: Check notifications
                mockMvc.perform(get("/api/notifications")
                                .with(user(regularUser.getUsername()).roles("USER")))
                                .andExpect(status().isOk());

                // Step 5: Search chat messages
                mockMvc.perform(get("/api/chat/messages/search")
                                .param("query", "Updated")
                                .with(user(regularUser.getUsername()).roles("USER")))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].content")
                                                .value("Updated: Hello everyone, this is a test message"));
        }

        @Test
        void testDepartmentReorganizationWorkflow_AsAdmin_ShouldCompleteSuccessfully() throws Exception {
                // Step 1: Create a parent department
                Department parentDept = new Department();
                parentDept.setName("Technology Division");
                parentDept.setDepPath("/Technology");
                parentDept.setIsParent(true);

                String parentResponse = mockMvc.perform(post("/api/departments")
                                .with(user(UserDetailsImpl.build(adminUser)))
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
                                .with(user(UserDetailsImpl.build(adminUser)))
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
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(childDept2)))
                                .andExpect(status().isCreated());

                // Step 3: Verify department tree structure
                mockMvc.perform(get("/api/departments/tree")
                                .with(user(UserDetailsImpl.build(adminUser))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[?(@.name=='Technology Division')]").exists());

                // Step 4: Get children of parent department
                mockMvc.perform(get("/api/departments/parent/{parentId}", createdParent.getId())
                                .with(user(UserDetailsImpl.build(adminUser))))
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
                                .with(user(UserDetailsImpl.build(adminUser)))
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(announcement)))
                                .andExpect(status().isOk());
        }
}