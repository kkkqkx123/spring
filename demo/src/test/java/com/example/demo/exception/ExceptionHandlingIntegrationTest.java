package com.example.demo.exception;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.service.EmployeeService;

@SpringBootTest
@AutoConfigureMockMvc
class ExceptionHandlingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private EmployeeService employeeService;
    
    @Test
    @WithMockUser(roles = "HR_ADMIN")
    void shouldHandleEmployeeNotFoundException() throws Exception {
        // Given
        when(employeeService.getEmployeeById(anyLong())).thenThrow(new EmployeeNotFoundException(123L));
        
        // When/Then
        mockMvc.perform(get("/api/employees/123"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.message").value("Employee not found with id: 123"))
            .andExpect(jsonPath("$.errorCode").value("EMP-404"));
    }
    
    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void shouldHandleUnauthorizedAccess() throws Exception {
        // Given
        when(employeeService.getEmployeeById(anyLong())).thenThrow(new UnauthorizedAccessException("Employee", "VIEW"));
        
        // When/Then
        mockMvc.perform(get("/api/employees/123"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.status").value(403))
            .andExpect(jsonPath("$.message").value("Unauthorized access: Cannot perform 'VIEW' operation on 'Employee'"))
            .andExpect(jsonPath("$.errorCode").value("AUTH-403"));
    }
}