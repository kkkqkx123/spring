package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.example.demo.model.dto.EmployeeSearchCriteria;
import com.example.demo.model.entity.Employee;

import java.util.List;

/**
 * Integration tests for Employee REST endpoints
 * Tests full application stack including security, database, and business logic
 */
class EmployeeControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void testGetAllEmployees_AsAdmin_ShouldReturnEmployees() throws Exception {
        mockMvc.perform(get("/api/employees")
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].name").exists());
    }

    @Test
    void testGetAllEmployees_AsHRManager_ShouldReturnEmployees() throws Exception {
        mockMvc.perform(get("/api/employees")
                .with(user(hrManagerUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_HR_MANAGER"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void testGetAllEmployees_AsRegularUser_ShouldReturnEmployees() throws Exception {
        mockMvc.perform(get("/api/employees")
                .with(user(regularUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_USER"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void testGetAllEmployees_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetEmployeeById_AsAdmin_ShouldReturnEmployee() throws Exception {
        mockMvc.perform(get("/api/employees/{id}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testEmployee1.getId()))
                .andExpect(jsonPath("$.employeeNumber").value("EMP001"))
                .andExpect(jsonPath("$.name").value("John Doe"));
    }

    @Test
    void testGetEmployeeById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/employees/{id}", 999L)
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateEmployee_AsAdmin_ShouldCreateEmployee() throws Exception {
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("EMP003");
        newEmployee.setName("Bob Johnson");
        newEmployee.setEmail("bob.johnson@example.com");
        newEmployee.setPhone("+1234567892");
        newEmployee.setDepartment(itDepartment);
        newEmployee.setPosition(developerPosition);
        newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);

        mockMvc.perform(post("/api/employees")
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_CREATE")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeNumber").value("EMP003"))
                .andExpect(jsonPath("$.name").value("Bob Johnson"));
    }

    @Test
    void testCreateEmployee_AsHRManager_ShouldCreateEmployee() throws Exception {
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("EMP004");
        newEmployee.setName("Alice Brown");
        newEmployee.setEmail("alice.brown@example.com");
        newEmployee.setDepartment(hrDepartment);
        newEmployee.setPosition(managerPosition);
        newEmployee.setStatus(Employee.EmployeeStatus.ACTIVE);

        mockMvc.perform(post("/api/employees")
                .with(user(hrManagerUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_HR_MANAGER"),
                    new SimpleGrantedAuthority("EMPLOYEE_CREATE")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeNumber").value("EMP004"));
    }

    @Test
    void testCreateEmployee_AsRegularUser_ShouldReturn403() throws Exception {
        Employee newEmployee = new Employee();
        newEmployee.setEmployeeNumber("EMP005");
        newEmployee.setName("Charlie Wilson");
        newEmployee.setEmail("charlie.wilson@example.com");
        newEmployee.setDepartment(itDepartment); // 添加department属性以通过验证

        mockMvc.perform(post("/api/employees")
                .with(user(regularUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_USER")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateEmployee_AsAdmin_ShouldUpdateEmployee() throws Exception {
        testEmployee1.setName("John Doe Updated");
        testEmployee1.setEmail("john.doe.updated@example.com");

        mockMvc.perform(put("/api/employees/{id}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_UPDATE")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testEmployee1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Doe Updated"))
                .andExpect(jsonPath("$.email").value("john.doe.updated@example.com"));
    }

    @Test
    void testUpdateEmployee_AsRegularUser_ShouldReturn403() throws Exception {
        testEmployee1.setName("John Doe Updated");

        mockMvc.perform(put("/api/employees/{id}", testEmployee1.getId())
                .with(user(regularUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_USER")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testEmployee1)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteEmployee_AsAdmin_ShouldDeleteEmployee() throws Exception {
        mockMvc.perform(delete("/api/employees/{id}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_DELETE")))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify employee is deleted
        mockMvc.perform(get("/api/employees/{id}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteEmployee_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/employees/{id}", testEmployee1.getId())
                .with(user(regularUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_USER")))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testBatchDeleteEmployees_AsAdmin_ShouldDeleteEmployees() throws Exception {
        List<Long> employeeIds = List.of(testEmployee1.getId(), testEmployee2.getId());

        mockMvc.perform(delete("/api/employees")
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_DELETE")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(employeeIds)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(2));
    }

    @Test
    void testSearchEmployees_AsAdmin_ShouldReturnFilteredResults() throws Exception {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria();
        criteria.setName("John");

        mockMvc.perform(post("/api/employees/search")
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(criteria)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].name").value("John Doe"));
    }

    @Test
    void testImportEmployees_AsAdmin_ShouldImportFromExcel() throws Exception {
        // Create a simple mock Excel file with valid test data
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "employees.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                createMockExcelContent()
        );

        mockMvc.perform(multipart("/api/employees/import")
                .file(file)
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_CREATE")))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isCreated());
    }

    @Test
    void testImportEmployees_AsRegularUser_ShouldReturn403() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "employees.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "mock-excel-content".getBytes()
        );

        mockMvc.perform(multipart("/api/employees/import")
                .file(file)
                .with(user(regularUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_USER")))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testExportEmployees_AsAdmin_ShouldReturnExcelFile() throws Exception {
        List<Long> employeeIds = List.of(testEmployee1.getId(), testEmployee2.getId());

        mockMvc.perform(post("/api/employees/export")
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ")))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(employeeIds)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", 
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    void testGetImportTemplate_AsAdmin_ShouldReturnTemplate() throws Exception {
        mockMvc.perform(get("/api/employees/import-template")
                .with(user(adminUser.getUsername()).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("EMPLOYEE_READ"))))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", 
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    /**
     * Create a mock Excel file content for testing import functionality
     */
    private byte[] createMockExcelContent() throws Exception {
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Employees");
            
            // Create header row
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = {
                "Employee Number", "Name", "Email", "Phone", "Department", "Position", 
                "Hire Date", "Status", "Gender", "Birth Date", "Address", "Salary",
                "Emergency Contact Name", "Emergency Contact Phone", "Notes"
            };
            
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            
            // Create a data row with test data that matches our test setup
            org.apache.poi.ss.usermodel.Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("EMP999"); // Employee Number
            dataRow.createCell(1).setCellValue("Test Import Employee"); // Name
            dataRow.createCell(2).setCellValue("test.import@example.com"); // Email
            dataRow.createCell(3).setCellValue("+1234567999"); // Phone
            dataRow.createCell(4).setCellValue("IT Department"); // Department (matches test data)
            dataRow.createCell(5).setCellValue("Software Developer"); // Position (matches test data)
            dataRow.createCell(6).setCellValue("2023-01-01"); // Hire Date
            dataRow.createCell(7).setCellValue("Active"); // Status
            dataRow.createCell(8).setCellValue("Male"); // Gender
            dataRow.createCell(9).setCellValue("1990-01-01"); // Birth Date
            dataRow.createCell(10).setCellValue("123 Test St"); // Address
            dataRow.createCell(11).setCellValue(50000.0); // Salary
            dataRow.createCell(12).setCellValue("Emergency Contact"); // Emergency Contact Name
            dataRow.createCell(13).setCellValue("+1234567888"); // Emergency Contact Phone
            dataRow.createCell(14).setCellValue("Test notes"); // Notes
            
            workbook.write(out);
            return out.toByteArray();
        }
    }
}