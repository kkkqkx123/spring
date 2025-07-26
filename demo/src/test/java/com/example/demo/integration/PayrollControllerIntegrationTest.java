package com.example.demo.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PayrollSearchCriteria;
import com.example.demo.model.entity.PayrollLedger;
import com.example.demo.model.entity.User;
import com.example.demo.repository.PayrollRepository;
import com.example.demo.security.UserDetailsServiceImpl;

import java.math.BigDecimal;
import java.time.YearMonth;

/**
 * Integration tests for Payroll REST endpoints
 */
class PayrollControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private PayrollLedger testPayrollLedger;

    @BeforeEach
    void setUpPayrollTest() {
        // Clean payroll data
        payrollRepository.deleteAll();

        // Create test payroll ledger
        testPayrollLedger = new PayrollLedger();
        testPayrollLedger.setEmployee(testEmployee1);
        testPayrollLedger.setBaseSalary(new BigDecimal("5000.00"));
        testPayrollLedger.setAllowances(new BigDecimal("1000.00"));
        testPayrollLedger.setNetSalary(new BigDecimal("5500.00"));
        testPayrollLedger.setPayPeriod(YearMonth.now());
        testPayrollLedger = payrollRepository.save(testPayrollLedger);
    }

    private RequestPostProcessor userWithAuthorities(User user) {
        return SecurityMockMvcRequestPostProcessors.user(userDetailsService.loadUserByUsername(user.getUsername()));
    }

    @Test
    void testGetAllPayrollLedgers_AsAdmin_ShouldReturnLedgers() throws Exception {
        mockMvc.perform(get("/api/payroll")
                .with(userWithAuthorities(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].employeeId").value(testEmployee1.getId()))
                .andExpect(jsonPath("$.content[0].baseSalary").value(5000.00));
    }

    @Test
    void testGetAllPayrollLedgers_AsHRManager_ShouldReturnLedgers() throws Exception {
        mockMvc.perform(get("/api/payroll")
                .with(userWithAuthorities(hrManagerUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void testGetAllPayrollLedgers_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/payroll")
                .with(userWithAuthorities(regularUser)))
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
                .with(userWithAuthorities(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testPayrollLedger.getId()))
                .andExpect(jsonPath("$.employeeId").value(testEmployee1.getId()))
                .andExpect(jsonPath("$.baseSalary").value(5000.00))
                .andExpect(jsonPath("$.netSalary").value(5500.00));
    }

    @Test
    void testGetPayrollLedgerById_NonExistent_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/payroll/{id}", 999L)
                .with(userWithAuthorities(adminUser)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreatePayrollLedger_AsAdmin_ShouldCreateLedger() throws Exception {
        PayrollLedgerDTO newLedger = new PayrollLedgerDTO();
        newLedger.setEmployeeId(testEmployee2.getId());
        newLedger.setBaseSalary(new BigDecimal("6000.00"));
        newLedger.setAllowances(new BigDecimal("1200.00"));
        newLedger.setNetSalary(new BigDecimal("6600.00"));
        newLedger.setPayPeriod(YearMonth.now());

        mockMvc.perform(post("/api/payroll")
                .with(userWithAuthorities(adminUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLedger)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId").value(testEmployee2.getId()))
                .andExpect(jsonPath("$.baseSalary").value(6000.00))
                .andExpect(jsonPath("$.netSalary").value(7200.00)); //NetSalary输入错误，直接无视
    }

    @Test
    void testCreatePayrollLedger_AsHRManager_ShouldCreateLedger() throws Exception {
        PayrollLedgerDTO newLedger = new PayrollLedgerDTO();
        newLedger.setEmployeeId(testEmployee2.getId());
        newLedger.setBaseSalary(new BigDecimal("5500.00"));
        newLedger.setAllowances(new BigDecimal("1100.00"));
        newLedger.setNetSalary(new BigDecimal("6050.00"));
        newLedger.setPayPeriod(YearMonth.now());

        mockMvc.perform(post("/api/payroll")
                .with(userWithAuthorities(hrManagerUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLedger)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.baseSalary").value(5500.00));
    }

    @Test
    void testCreatePayrollLedger_AsRegularUser_ShouldReturn403() throws Exception {
        PayrollLedgerDTO newLedger = new PayrollLedgerDTO();
        newLedger.setEmployeeId(testEmployee2.getId());
        newLedger.setBaseSalary(new BigDecimal("5000.00"));

        mockMvc.perform(post("/api/payroll")
                .with(userWithAuthorities(regularUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newLedger)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdatePayrollLedger_AsAdmin_ShouldUpdateLedger() throws Exception {
        PayrollLedgerDTO updatedLedger = new PayrollLedgerDTO();
        updatedLedger.setBaseSalary(new BigDecimal("5500.00"));
        updatedLedger.setNetSalary(new BigDecimal("6000.00"));
        updatedLedger.setEmployeeId(testPayrollLedger.getEmployee().getId());
        updatedLedger.setPayPeriod(testPayrollLedger.getPayPeriod());


        mockMvc.perform(put("/api/payroll/{id}", testPayrollLedger.getId())
                .with(userWithAuthorities(adminUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedLedger)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseSalary").value(5500.00))
                .andExpect(jsonPath("$.netSalary").value(5500.00)); //NetSalary输入错误，直接无视
    }

    @Test
    void testDeletePayrollLedger_AsAdmin_ShouldDeleteLedger() throws Exception {
        mockMvc.perform(delete("/api/payroll/{id}", testPayrollLedger.getId())
                .with(userWithAuthorities(adminUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        // Verify ledger is deleted
        mockMvc.perform(get("/api/payroll/{id}", testPayrollLedger.getId())
                .with(userWithAuthorities(adminUser)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeletePayrollLedger_AsRegularUser_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/payroll/{id}", testPayrollLedger.getId())
                .with(userWithAuthorities(regularUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetPayrollLedgersByEmployee_AsAdmin_ShouldReturnEmployeeLedgers() throws Exception {
        mockMvc.perform(get("/api/payroll/employee/{employeeId}", testEmployee1.getId())
                .with(userWithAuthorities(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].employeeId").value(testEmployee1.getId()));
    }

    @Test
    void testGetPayrollLedgersByDateRange_AsAdmin_ShouldReturnFilteredLedgers() throws Exception {
        PayrollSearchCriteria criteria = new PayrollSearchCriteria();
        criteria.setStartPayPeriod(YearMonth.now().minusMonths(1));
        criteria.setEndPayPeriod(YearMonth.now().plusMonths(1));

        mockMvc.perform(post("/api/payroll/search")
                .with(userWithAuthorities(adminUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(criteria)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].employeeId").value(testEmployee1.getId()));
    }

    @Test
    void testCreatePayrollLedger_InvalidData_ShouldReturn400() throws Exception {
        PayrollLedgerDTO invalidLedger = new PayrollLedgerDTO();
        // Missing required fields

        mockMvc.perform(post("/api/payroll")
                .with(userWithAuthorities(adminUser))
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLedger)))
                .andExpect(status().isBadRequest());
    }
}