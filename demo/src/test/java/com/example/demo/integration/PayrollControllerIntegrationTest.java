package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.repository.PayrollRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Integration tests for Payroll REST endpoints
 */
class PayrollControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PayrollRepository payrollRepository;

    private PayrollLedger testPayrollLedger;

    @BeforeEach
    void setUpPayrollTest() {
        // Clean payroll data
        payrollRepository.deleteAll();

        // Create test payroll ledger
        testPayrollLedger = new PayrollLedger();
        testPayrollLedger.setEmployeeId(testEmployee1.getId());
        testPayrollLedger.setBaseSalary(new BigDecimal("5000.00"));
        testPayrollLedger.setAllowances(new BigDecimal("1000.00"));
        testPayrollLedger.setDeductions(new BigDecimal("500.00"));
        testPayrollLedger.setNetSalary(new BigDecimal("5500.00"));
        testPayrollLedger.setPayPeriod(LocalDate.now());
        testPayrollLedger = payrollRepository.save(testPayrollLedger);
    }

    @Test
    void testGetAllPayrollLedgers_AsAdmin_ShouldReturnLedgers() throws Exception {
        mockMvc.perform(get("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].employeeId").value(testEmployee1.getId()))
                .andExpect(jsonPath("$.content[0].baseSalary").value(5000.00));
    }

    @Test
    void testGetAllPayrollLedgers_AsHRManager_ShouldReturnLedgers() throws Exception {
        mockMvc.perform(get("/api/payroll")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void testGetAllPayrollLedgers_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/payroll")
                .with(user(regularUser.getUsername()).roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetAllPayrollLedgers_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/payroll"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetPayrollLedgerById_AsAdmin_ShouldReturnLedger() throws Exception {
        mockMvc.perform(get("/api/payroll/{id}", testPayrollLedger.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPayrollLedger.getId()))
                .andExpect(jsonPath("$.employeeId").value(testEmployee1.getId()))
                .andExpect(jsonPath("$.baseSalary").value(5000.00))
                .andExpect(jsonPath("$.netSalary").value(5500.00));
    }

    @Test
    void testGetPayrollLedgerById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/payroll/{id}", 999L)
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreatePayrollLedger_AsAdmin_ShouldCreateLedger() throws Exception {
        PayrollLedger newLedger = new PayrollLedger();
        newLedger.setEmployeeId(testEmployee2.getId());
        newLedger.setBaseSalary(new BigDecimal("6000.00"));
        newLedger.setAllowances(new BigDecimal("1200.00"));
        newLedger.setDeductions(new BigDecimal("600.00"));
        newLedger.setNetSalary(new BigDecimal("6600.00"));
        newLedger.setPayPeriod(LocalDate.now());

        mockMvc.perform(post("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLedger)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId").value(testEmployee2.getId()))
                .andExpect(jsonPath("$.baseSalary").value(6000.00))
                .andExpect(jsonPath("$.netSalary").value(6600.00));
    }

    @Test
    void testCreatePayrollLedger_AsHRManager_ShouldCreateLedger() throws Exception {
        PayrollLedger newLedger = new PayrollLedger();
        newLedger.setEmployeeId(testEmployee2.getId());
        newLedger.setBaseSalary(new BigDecimal("5500.00"));
        newLedger.setAllowances(new BigDecimal("1100.00"));
        newLedger.setDeductions(new BigDecimal("550.00"));
        newLedger.setNetSalary(new BigDecimal("6050.00"));
        newLedger.setPayPeriod(LocalDate.now());

        mockMvc.perform(post("/api/payroll")
                .with(user(hrManagerUser.getUsername()).roles("HR_MANAGER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLedger)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.baseSalary").value(5500.00));
    }

    @Test
    void testCreatePayrollLedger_AsRegularUser_ShouldReturn403() throws Exception {
        PayrollLedger newLedger = new PayrollLedger();
        newLedger.setEmployeeId(testEmployee2.getId());
        newLedger.setBaseSalary(new BigDecimal("5000.00"));

        mockMvc.perform(post("/api/payroll")
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLedger)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdatePayrollLedger_AsAdmin_ShouldUpdateLedger() throws Exception {
        testPayrollLedger.setBaseSalary(new BigDecimal("5500.00"));
        testPayrollLedger.setNetSalary(new BigDecimal("6000.00"));

        mockMvc.perform(put("/api/payroll/{id}", testPayrollLedger.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testPayrollLedger)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseSalary").value(5500.00))
                .andExpect(jsonPath("$.netSalary").value(6000.00));
    }

    @Test
    void testDeletePayrollLedger_AsAdmin_ShouldDeleteLedger() throws Exception {
        mockMvc.perform(delete("/api/payroll/{id}", testPayrollLedger.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify ledger is deleted
        mockMvc.perform(get("/api/payroll/{id}", testPayrollLedger.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeletePayrollLedger_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/payroll/{id}", testPayrollLedger.getId())
                .with(user(regularUser.getUsername()).roles("USER"))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetPayrollLedgersByEmployee_AsAdmin_ShouldReturnEmployeeLedgers() throws Exception {
        mockMvc.perform(get("/api/payroll/employee/{employeeId}", testEmployee1.getId())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].employeeId").value(testEmployee1.getId()));
    }

    @Test
    void testGetPayrollLedgersByDateRange_AsAdmin_ShouldReturnFilteredLedgers() throws Exception {
        LocalDate startDate = LocalDate.now().minusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(1);

        mockMvc.perform(get("/api/payroll/date-range")
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
                .with(user(adminUser.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].employeeId").value(testEmployee1.getId()));
    }

    @Test
    void testCreatePayrollLedger_InvalidData_ShouldReturn400() throws Exception {
        PayrollLedger invalidLedger = new PayrollLedger();
        // Missing required fields

        mockMvc.perform(post("/api/payroll")
                .with(user(adminUser.getUsername()).roles("ADMIN"))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLedger)))
                .andExpect(status().isBadRequest());
    }
}