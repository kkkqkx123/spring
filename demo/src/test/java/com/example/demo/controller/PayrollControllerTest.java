package com.example.demo.controller;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.model.dto.PayrollLedgerDTO;
import com.example.demo.model.dto.PayrollSearchCriteria;
import com.example.demo.model.entity.PayrollLedger.PayrollStatus;
import com.example.demo.service.PayrollService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(PayrollController.class)
public class PayrollControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PayrollService payrollService;

    private PayrollLedgerDTO payrollLedgerDTO;
    private List<PayrollLedgerDTO> payrollLedgers;
    private YearMonth currentPeriod;

    @BeforeEach
    void setUp() {
        currentPeriod = YearMonth.now();
        
        payrollLedgerDTO = new PayrollLedgerDTO();
        payrollLedgerDTO.setId(1L);
        payrollLedgerDTO.setEmployeeId(1L);
        payrollLedgerDTO.setEmployeeName("John Doe");
        payrollLedgerDTO.setEmployeeNumber("EMP001");
        payrollLedgerDTO.setDepartmentId(1L);
        payrollLedgerDTO.setDepartmentName("IT Department");
        payrollLedgerDTO.setPayPeriod(currentPeriod);
        payrollLedgerDTO.setFormattedPayPeriod(currentPeriod.toString());
        payrollLedgerDTO.setBaseSalary(new BigDecimal("5000.00"));
        payrollLedgerDTO.setOvertimePay(new BigDecimal("500.00"));
        payrollLedgerDTO.setBonus(new BigDecimal("1000.00"));
        payrollLedgerDTO.setAllowances(new BigDecimal("300.00"));
        payrollLedgerDTO.setTaxDeductions(new BigDecimal("1000.00"));
        payrollLedgerDTO.setInsuranceDeductions(new BigDecimal("200.00"));
        payrollLedgerDTO.setOtherDeductions(new BigDecimal("100.00"));
        payrollLedgerDTO.setNetSalary(new BigDecimal("5500.00"));
        payrollLedgerDTO.setGrossSalary(new BigDecimal("6800.00"));
        payrollLedgerDTO.setTotalDeductions(new BigDecimal("1300.00"));
        payrollLedgerDTO.setStatus(PayrollStatus.DRAFT);
        payrollLedgerDTO.setStatusDisplayName("Draft");
        payrollLedgerDTO.setModifiable(true);
        
        PayrollLedgerDTO payrollLedgerDTO2 = new PayrollLedgerDTO();
        payrollLedgerDTO2.setId(2L);
        payrollLedgerDTO2.setEmployeeId(2L);
        payrollLedgerDTO2.setEmployeeName("Jane Smith");
        payrollLedgerDTO2.setEmployeeNumber("EMP002");
        payrollLedgerDTO2.setDepartmentId(2L);
        payrollLedgerDTO2.setDepartmentName("HR Department");
        payrollLedgerDTO2.setPayPeriod(currentPeriod);
        payrollLedgerDTO2.setFormattedPayPeriod(currentPeriod.toString());
        payrollLedgerDTO2.setBaseSalary(new BigDecimal("6000.00"));
        payrollLedgerDTO2.setOvertimePay(BigDecimal.ZERO);
        payrollLedgerDTO2.setBonus(new BigDecimal("1500.00"));
        payrollLedgerDTO2.setAllowances(new BigDecimal("400.00"));
        payrollLedgerDTO2.setTaxDeductions(new BigDecimal("1200.00"));
        payrollLedgerDTO2.setInsuranceDeductions(new BigDecimal("250.00"));
        payrollLedgerDTO2.setOtherDeductions(new BigDecimal("150.00"));
        payrollLedgerDTO2.setNetSalary(new BigDecimal("6300.00"));
        payrollLedgerDTO2.setGrossSalary(new BigDecimal("7900.00"));
        payrollLedgerDTO2.setTotalDeductions(new BigDecimal("1600.00"));
        payrollLedgerDTO2.setStatus(PayrollStatus.APPROVED);
        payrollLedgerDTO2.setStatusDisplayName("Approved");
        payrollLedgerDTO2.setModifiable(false);
        
        payrollLedgers = new ArrayList<>();
        payrollLedgers.add(payrollLedgerDTO);
        payrollLedgers.add(payrollLedgerDTO2);
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getAllPayrollLedgers_ShouldReturnPayrollLedgers() throws Exception {
        // Arrange
        Page<PayrollLedgerDTO> page = new PageImpl<>(payrollLedgers);
        when(payrollService.getAllPayrollLedgers(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/payroll")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id", is(1)))
                .andExpect(jsonPath("$.content[0].employeeName", is("John Doe")))
                .andExpect(jsonPath("$.content[1].id", is(2)))
                .andExpect(jsonPath("$.content[1].employeeName", is("Jane Smith")));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getPayrollLedger_ShouldReturnPayrollLedger() throws Exception {
        // Arrange
        when(payrollService.getPayrollLedger(1L)).thenReturn(payrollLedgerDTO);

        // Act & Assert
        mockMvc.perform(get("/api/payroll/1")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.employeeName", is("John Doe")))
                .andExpect(jsonPath("$.netSalary", is(5500.00)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_CREATE")
    void createPayrollLedger_ShouldCreateAndReturnPayrollLedger() throws Exception {
        // Arrange
        when(payrollService.createPayrollLedger(any())).thenReturn(payrollLedgerDTO);

        // Act & Assert
        mockMvc.perform(post("/api/payroll")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payrollLedgerDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.employeeName", is("John Doe")))
                .andExpect(jsonPath("$.netSalary", is(5500.00)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_UPDATE")
    void updatePayrollLedger_ShouldUpdateAndReturnPayrollLedger() throws Exception {
        // Arrange
        when(payrollService.updatePayrollLedger(eq(1L), any())).thenReturn(payrollLedgerDTO);

        // Act & Assert
        mockMvc.perform(put("/api/payroll/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payrollLedgerDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.employeeName", is("John Doe")))
                .andExpect(jsonPath("$.netSalary", is(5500.00)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_DELETE")
    void deletePayrollLedger_ShouldDeletePayrollLedger() throws Exception {
        // Arrange
        doNothing().when(payrollService).deletePayrollLedger(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/payroll/1")
                .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void searchPayrollLedgers_ShouldReturnMatchingPayrollLedgers() throws Exception {
        // Arrange
        PayrollSearchCriteria criteria = new PayrollSearchCriteria();
        criteria.setEmployeeId(1L);
        criteria.setPayPeriod(currentPeriod);
        
        Page<PayrollLedgerDTO> page = new PageImpl<>(List.of(payrollLedgerDTO));
        when(payrollService.searchPayrollLedgers(any(), any()))
                .thenReturn(page);

        // Act & Assert
        mockMvc.perform(post("/api/payroll/search")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(criteria)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id", is(1)))
                .andExpect(jsonPath("$.content[0].employeeName", is("John Doe")));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getPayrollLedgersByEmployee_ShouldReturnPayrollLedgers() throws Exception {
        // Arrange
        Page<PayrollLedgerDTO> page = new PageImpl<>(List.of(payrollLedgerDTO));
        when(payrollService.getPayrollLedgersByEmployee(eq(1L), any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/payroll/employee/1")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id", is(1)))
                .andExpect(jsonPath("$.content[0].employeeId", is(1)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getPayrollLedgersByPayPeriod_ShouldReturnPayrollLedgers() throws Exception {
        // Arrange
        Page<PayrollLedgerDTO> page = new PageImpl<>(payrollLedgers);
        when(payrollService.getPayrollLedgersByPayPeriod(any(), any()))
                .thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/payroll/period/{year}/{month}", 
                currentPeriod.getYear(), currentPeriod.getMonthValue())
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id", is(1)))
                .andExpect(jsonPath("$.content[1].id", is(2)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getPayrollLedgersByDepartment_ShouldReturnPayrollLedgers() throws Exception {
        // Arrange
        Page<PayrollLedgerDTO> page = new PageImpl<>(List.of(payrollLedgerDTO));
        when(payrollService.getPayrollLedgersByDepartment(eq(1L), any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/payroll/department/1")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id", is(1)))
                .andExpect(jsonPath("$.content[0].departmentId", is(1)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_UPDATE")
    void calculatePayroll_ShouldReturnCalculatedPayrollLedger() throws Exception {
        // Arrange
        PayrollLedgerDTO inputDTO = new PayrollLedgerDTO();
        inputDTO.setEmployeeId(1L);
        inputDTO.setPayPeriod(currentPeriod);
        inputDTO.setBaseSalary(new BigDecimal("5000.00"));
        
        PayrollLedgerDTO calculatedDTO = new PayrollLedgerDTO();
        calculatedDTO.setEmployeeId(1L);
        calculatedDTO.setPayPeriod(currentPeriod);
        calculatedDTO.setBaseSalary(new BigDecimal("5000.00"));
        calculatedDTO.setNetSalary(new BigDecimal("5000.00"));
        calculatedDTO.setStatus(PayrollStatus.CALCULATED);
        
        when(payrollService.calculatePayroll(any())).thenReturn(calculatedDTO);

        // Act & Assert
        mockMvc.perform(post("/api/payroll/calculate")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(inputDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId", is(1)))
                .andExpect(jsonPath("$.netSalary", is(5000.00)))
                .andExpect(jsonPath("$.status", is("CALCULATED")));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void validatePayrollCalculations_WithValidCalculations_ShouldReturnTrue() throws Exception {
        // Arrange
        when(payrollService.validatePayrollCalculations(any())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/payroll/validate")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payrollLedgerDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_UPDATE")
    void updatePayrollStatus_ShouldUpdateStatus() throws Exception {
        // Arrange
        PayrollLedgerDTO updatedDTO = new PayrollLedgerDTO();
        updatedDTO.setId(1L);
        updatedDTO.setStatus(PayrollStatus.APPROVED);
        
        when(payrollService.updatePayrollStatus(eq(1L), eq(PayrollStatus.APPROVED))).thenReturn(updatedDTO);

        // Act & Assert
        mockMvc.perform(put("/api/payroll/1/status")
                .with(csrf())
                .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.status", is("APPROVED")));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_UPDATE")
    void processPayment_ShouldProcessPayment() throws Exception {
        // Arrange
        PayrollLedgerDTO paidDTO = new PayrollLedgerDTO();
        paidDTO.setId(1L);
        paidDTO.setStatus(PayrollStatus.PAID);
        paidDTO.setPaymentReference("PAY-REF-001");
        
        when(payrollService.processPayment(eq(1L), eq("PAY-REF-001"))).thenReturn(paidDTO);

        // Act & Assert
        mockMvc.perform(put("/api/payroll/1/payment")
                .with(csrf())
                .param("paymentReference", "PAY-REF-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.status", is("PAID")))
                .andExpect(jsonPath("$.paymentReference", is("PAY-REF-001")));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getPayrollStatsByDepartment_ShouldReturnDepartmentStats() throws Exception {
        // Arrange
        List<Map<String, Object>> stats = new ArrayList<>();
        Map<String, Object> stat1 = new HashMap<>();
        stat1.put("departmentName", "IT Department");
        stat1.put("count", 5L);
        stat1.put("totalAmount", new BigDecimal("25000.00"));
        stats.add(stat1);
        
        Map<String, Object> stat2 = new HashMap<>();
        stat2.put("departmentName", "HR Department");
        stat2.put("count", 3L);
        stat2.put("totalAmount", new BigDecimal("15000.00"));
        stats.add(stat2);
        
        when(payrollService.getPayrollStatsByDepartment(any())).thenReturn(stats);

        // Act & Assert
        mockMvc.perform(get("/api/payroll/stats/department/{year}/{month}", 
                currentPeriod.getYear(), currentPeriod.getMonthValue())
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].departmentName", is("IT Department")))
                .andExpect(jsonPath("$[0].count", is(5)))
                .andExpect(jsonPath("$[1].departmentName", is("HR Department")))
                .andExpect(jsonPath("$[1].count", is(3)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_READ")
    void getTotalPayrollAmount_ShouldReturnTotalAmount() throws Exception {
        // Arrange
        when(payrollService.getTotalPayrollAmount(any()))
                .thenReturn(new BigDecimal("40000.00"));

        // Act & Assert
        mockMvc.perform(get("/api/payroll/total/{year}/{month}", 
                currentPeriod.getYear(), currentPeriod.getMonthValue())
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount", is(40000.00)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_CREATE")
    void generatePayrollLedgers_ShouldGenerateAndReturnLedgers() throws Exception {
        // Arrange
        when(payrollService.generatePayrollLedgers(any())).thenReturn(payrollLedgers);

        // Act & Assert
        mockMvc.perform(post("/api/payroll/generate/{year}/{month}", 
                currentPeriod.getYear(), currentPeriod.getMonthValue())
                .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[1].id", is(2)));
    }

    @Test
    @WithMockUser(authorities = "PAYROLL_CREATE")
    void generatePayrollLedger_ShouldGenerateAndReturnLedger() throws Exception {
        // Arrange
        when(payrollService.generatePayrollLedger(eq(1L), any())).thenReturn(payrollLedgerDTO);

        // Act & Assert
        mockMvc.perform(post("/api/payroll/generate/employee/1/{year}/{month}", 
                currentPeriod.getYear(), currentPeriod.getMonthValue())
                .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.employeeId", is(1)));
    }
}