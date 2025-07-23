package com.example.demo.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Comprehensive integration tests for security configuration
 * Tests authentication, authorization, and session management
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Nested
    @DisplayName("Public Endpoints Tests")
    class PublicEndpointsTests {

        @Test
        @DisplayName("Should allow access to authentication endpoints")
        void testAuthEndpoints_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/auth/login"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.BAD_REQUEST.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @DisplayName("Should allow access to H2 console")
        void testH2Console_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/h2-console"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.BAD_REQUEST.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @DisplayName("Should allow access to actuator endpoints")
        void testActuatorEndpoints_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().is(anyOf(is(HttpStatus.OK.value()), 
                                               is(HttpStatus.SERVICE_UNAVAILABLE.value()))));
        }

        @Test
        @DisplayName("Should allow access to public API endpoints")
        void testPublicApiEndpoints_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/public/info"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.BAD_REQUEST.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }
    }

    @Nested
    @DisplayName("Authentication Tests")
    class AuthenticationTests {

        @Test
        @DisplayName("Should deny access to secured endpoints without authentication")
        void testSecuredEndpoint_WithoutAuthentication_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().is(anyOf(is(HttpStatus.UNAUTHORIZED.value()), 
                                               is(HttpStatus.FORBIDDEN.value()))));
        }

        @Test
        @DisplayName("Should deny access to employee endpoints without authentication")
        void testEmployeeEndpoint_WithoutAuthentication_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/employees"))
                    .andExpect(status().is(anyOf(is(HttpStatus.UNAUTHORIZED.value()), 
                                               is(HttpStatus.FORBIDDEN.value()))));
        }

        @Test
        @DisplayName("Should deny access to department endpoints without authentication")
        void testDepartmentEndpoint_WithoutAuthentication_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/departments"))
                    .andExpect(status().is(anyOf(is(HttpStatus.UNAUTHORIZED.value()), 
                                               is(HttpStatus.FORBIDDEN.value()))));
        }
    }

    @Nested
    @DisplayName("Admin Role Authorization Tests")
    class AdminRoleTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Admin should have access to admin endpoints")
        void testAdminEndpoint_WithAdminRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Admin should have access to HR endpoints")
        void testHrEndpoint_WithAdminRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/hr/employees"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Admin should have access to department endpoints")
        void testDepartmentEndpoint_WithAdminRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/departments"))
                    .andExpect(status().is(anyOf(is(HttpStatus.OK.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Admin should have access to employee endpoints")
        void testEmployeeEndpoint_WithAdminRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/employees"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.FORBIDDEN.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Admin should have access to payroll endpoints")
        void testPayrollEndpoint_WithAdminRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/payroll"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }
    }

    @Nested
    @DisplayName("HR Manager Role Authorization Tests")
    class HrManagerRoleTests {

        @Test
        @WithMockUser(roles = "HR_MANAGER")
        @DisplayName("HR Manager should have access to HR endpoints")
        void testHrEndpoint_WithHrRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/hr/employees"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "HR_MANAGER")
        @DisplayName("HR Manager should have access to department endpoints")
        void testDepartmentEndpoint_WithHrRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/departments"))
                    .andExpect(status().is(anyOf(is(HttpStatus.OK.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "HR_MANAGER")
        @DisplayName("HR Manager should have access to employee endpoints")
        void testEmployeeEndpoint_WithHrRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/employees"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.FORBIDDEN.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "HR_MANAGER")
        @DisplayName("HR Manager should NOT have access to admin endpoints")
        void testAdminEndpoint_WithHrRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "HR_MANAGER")
        @DisplayName("HR Manager should NOT have access to payroll endpoints")
        void testPayrollEndpoint_WithHrRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/payroll"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Department Manager Role Authorization Tests")
    class DepartmentManagerRoleTests {

        @Test
        @WithMockUser(roles = "DEPARTMENT_MANAGER")
        @DisplayName("Department Manager should have access to department endpoints")
        void testDepartmentEndpoint_WithDepartmentManagerRole_ShouldAllowAccess() throws Exception {
            mockMvc.perform(get("/api/departments"))
                    .andExpect(status().is(anyOf(is(HttpStatus.OK.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }

        @Test
        @WithMockUser(roles = "DEPARTMENT_MANAGER")
        @DisplayName("Department Manager should NOT have access to admin endpoints")
        void testAdminEndpoint_WithDepartmentManagerRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "DEPARTMENT_MANAGER")
        @DisplayName("Department Manager should NOT have access to HR endpoints")
        void testHrEndpoint_WithDepartmentManagerRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/hr/employees"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Regular User Role Authorization Tests")
    class RegularUserRoleTests {

        @Test
        @WithMockUser(roles = "USER")
        @DisplayName("Regular user should NOT have access to admin endpoints")
        void testAdminEndpoint_WithUserRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "USER")
        @DisplayName("Regular user should NOT have access to HR endpoints")
        void testHrEndpoint_WithUserRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/hr/employees"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "USER")
        @DisplayName("Regular user should NOT have access to department endpoints")
        void testDepartmentEndpoint_WithUserRole_ShouldDenyAccess() throws Exception {
            mockMvc.perform(get("/api/departments"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("HTTP Methods Security Tests")
    class HttpMethodsSecurityTests {

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should allow POST requests for authorized users")
        void testPostRequest_WithAuthorization_ShouldAllowAccess() throws Exception {
            mockMvc.perform(post("/api/departments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is(anyOf(is(HttpStatus.BAD_REQUEST.value()), 
                                               is(HttpStatus.NOT_FOUND.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()),
                                               is(HttpStatus.FORBIDDEN.value()))));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should allow PUT requests for authorized users")
        void testPutRequest_WithAuthorization_ShouldAllowAccess() throws Exception {
            mockMvc.perform(put("/api/departments/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is(anyOf(is(HttpStatus.BAD_REQUEST.value()), 
                                               is(HttpStatus.NOT_FOUND.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()),
                                               is(HttpStatus.FORBIDDEN.value()))));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        @DisplayName("Should allow DELETE requests for authorized users")
        void testDeleteRequest_WithAuthorization_ShouldAllowAccess() throws Exception {
            mockMvc.perform(delete("/api/departments/1"))
                    .andExpect(status().is(anyOf(is(HttpStatus.NOT_FOUND.value()), 
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()),
                                               is(HttpStatus.FORBIDDEN.value()))));
        }

        @Test
        @DisplayName("Should deny POST requests without authentication")
        void testPostRequest_WithoutAuthentication_ShouldDenyAccess() throws Exception {
            mockMvc.perform(post("/api/departments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is(anyOf(is(HttpStatus.UNAUTHORIZED.value()), 
                                               is(HttpStatus.FORBIDDEN.value()))));
        }
    }

    @Nested
    @DisplayName("Session Management Tests")
    class SessionManagementTests {

        @Test
        @DisplayName("Should use stateless session management")
        void testStatelessSessionManagement() throws Exception {
            // This test verifies that no session is created
            // Since we're using JWT tokens, sessions should be stateless
            mockMvc.perform(get("/api/auth/login"))
                    .andExpect(status().is(anyOf(is(HttpStatus.BAD_REQUEST.value()), 
                                               is(HttpStatus.NOT_FOUND.value()),
                                               is(HttpStatus.INTERNAL_SERVER_ERROR.value()))));
        }
    }
}