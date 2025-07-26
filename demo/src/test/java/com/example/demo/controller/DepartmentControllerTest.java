package com.example.demo.controller;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.security.TestSecurityConfig;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.dto.DepartmentDto;
import com.example.demo.model.entity.Department;
import com.example.demo.service.DepartmentService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityNotFoundException;

/**
 * Integration tests for DepartmentController
 */
@WebMvcTest(DepartmentController.class)
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = {
    "spring.security.csrf.enabled=false"
})
class DepartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockitoBean
    private DepartmentService departmentService;
    
    private Department itDepartment;
    private Department hrDepartment;
    private DepartmentDto itDepartmentDto;
    private DepartmentDto hrDepartmentDto;
    private List<Department> departments;
    private List<DepartmentDto> departmentTree;
    
    @BeforeEach
    void setUp() {
        // Create departments
        itDepartment = new Department();
        itDepartment.setId(1L);
        itDepartment.setName("IT Department");
        itDepartment.setDepPath("/1/");
        itDepartment.setIsParent(true);
        
        hrDepartment = new Department();
        hrDepartment.setId(2L);
        hrDepartment.setName("HR Department");
        hrDepartment.setDepPath("/2/");
        hrDepartment.setIsParent(false);
        
        // Create department DTOs
        itDepartmentDto = new DepartmentDto();
        itDepartmentDto.setId(1L);
        itDepartmentDto.setName("IT Department");
        itDepartmentDto.setDepPath("/1/");
        itDepartmentDto.setIsParent(true);
        itDepartmentDto.setEmployeeCount(10);
        itDepartmentDto.setChildren(new ArrayList<>());
        
        hrDepartmentDto = new DepartmentDto();
        hrDepartmentDto.setId(2L);
        hrDepartmentDto.setName("HR Department");
        hrDepartmentDto.setDepPath("/2/");
        hrDepartmentDto.setIsParent(false);
        hrDepartmentDto.setEmployeeCount(5);
        hrDepartmentDto.setChildren(new ArrayList<>());
        
        // Create lists
        departments = Arrays.asList(itDepartment, hrDepartment);
        departmentTree = Arrays.asList(itDepartmentDto, hrDepartmentDto);
    }
    
    @Test
    @WithMockUser
    void testGetAllDepartments_ReturnsAllDepartments() throws Exception {
        // Arrange
        when(departmentService.getAllDepartments()).thenReturn(departments);
        
        // Act & Assert
        mockMvc.perform(get("/api/departments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].parentId").value(1L))
            .andExpect(jsonPath("$[1].parentId").value(1L));
        
        verify(departmentService).getAllDepartments();
    }
    
    @Test
    @WithMockUser
    void testGetDepartmentById_WhenDepartmentExists_ReturnsDepartment() throws Exception {
        // Arrange
        when(departmentService.getDepartmentById(1L)).thenReturn(itDepartment);
        
        // Act & Assert
        mockMvc.perform(get("/api/departments/1"))
            .andExpect(status().isOk());
        
        verify(departmentService).getDepartmentById(1L);
    }
    
    @Test
    @WithMockUser
    void testGetDepartmentById_WhenDepartmentDoesNotExist_ReturnsNotFound() throws Exception {
        // Arrange
        when(departmentService.getDepartmentById(99L))
            .thenThrow(new EntityNotFoundException("Department not found with id: 99"));
        
        // Act & Assert
        mockMvc.perform(get("/api/departments/99"))
            .andExpect(status().isNotFound());
        
        verify(departmentService).getDepartmentById(99L);
    }
    
    @Test
    @WithMockUser
    void testGetDepartmentTree_ReturnsDepartmentTree() throws Exception {
        // Arrange
        when(departmentService.getDepartmentTree()).thenReturn(departmentTree);
        
        // Act & Assert
        mockMvc.perform(get("/api/departments/tree"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].name", is("IT Department")))
            .andExpect(jsonPath("$[1].name", is("HR Department")));
        
        verify(departmentService).getDepartmentTree();
    }
    
    @Test
    @WithMockUser
    void testGetChildDepartments_WhenParentExists_ReturnsChildDepartments() throws Exception {
        // Arrange
        Department devDepartment = new Department();
        devDepartment.setId(3L);
        devDepartment.setName("Development");
        devDepartment.setParentId(1L);
        
        Department qaDepartment = new Department();
        qaDepartment.setId(4L);
        qaDepartment.setName("QA");
        qaDepartment.setParentId(1L);
        
        List<Department> childDepartments = Arrays.asList(devDepartment, qaDepartment);
        
        // 验证父部门存在
        when(departmentService.getDepartmentById(1L)).thenReturn(new Department());
        when(departmentService.getChildDepartments(1L)).thenAnswer(invocation -> {
            Long pid = invocation.getArgument(0);
            if (!pid.equals(1L)) {
                throw new ResourceNotFoundException("Invalid parent ID");
        }
    return childDepartments;
});
        when(departmentService.convertToDto(any(Department.class))).thenAnswer(invocation -> {
            Department dept = invocation.getArgument(0);
            DepartmentDto dto = new DepartmentDto();
            dto.setId(dept.getId());
            dto.setName(dept.getName());
            return dto;
        });
        
        // Act & Assert
        mockMvc.perform(get("/api/departments/parent/1"))
            .andExpect(status().isOk());
        
        verify(departmentService).getChildDepartments(1L);
    }
    
    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreateDepartment_WhenValidData_CreatesDepartment() throws Exception {
        // Arrange
        DepartmentDto newDepartmentDto = new DepartmentDto();
        newDepartmentDto.setName("Finance Department");
        
        Department newDepartment = new Department();
        newDepartment.setId(3L);
        newDepartment.setName("Finance Department");
        
        DepartmentDto savedDto = new DepartmentDto();
        savedDto.setId(3L);
        savedDto.setName("Finance Department");
        
        when(departmentService.createDepartment(any())).thenReturn(newDepartment);
        when(departmentService.convertToDto(newDepartment)).thenReturn(savedDto);
        
        // Act & Assert
        mockMvc.perform(post("/api/departments")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDepartmentDto)))
            .andExpect(status().isCreated());
        
        verify(departmentService).createDepartment(any());
    }
    
    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreateDepartment_WhenInvalidData_ReturnsBadRequest() throws Exception {
        // Arrange
        DepartmentDto invalidDepartmentDto = new DepartmentDto();
        // Name is required but not provided
        
        // Act & Assert
        mockMvc.perform(post("/api/departments")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDepartmentDto)))
            .andExpect(status().isBadRequest());
        
        verify(departmentService, never()).createDepartment(any(DepartmentDto.class));
    }
    
    @Test
    @WithMockUser
    void testCreateDepartment_WhenUnauthorized_ReturnsForbidden() throws Exception {
        // Arrange
        DepartmentDto newDepartmentDto = new DepartmentDto();
        newDepartmentDto.setName("Finance Department");
        
        // Act & Assert
        mockMvc.perform(post("/api/departments")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDepartmentDto)))
            .andExpect(status().isForbidden());
        
        verify(departmentService, never()).createDepartment(any(DepartmentDto.class));
    }
    
    @Test
    @WithMockUser(roles = {"HR_MANAGER"})
    void testUpdateDepartment_WhenValidData_UpdatesDepartment() throws Exception {
        // Arrange
        DepartmentDto updatedDepartmentDto = new DepartmentDto();
        updatedDepartmentDto.setName("IT Department Updated");
        
        Department updatedDepartment = new Department();
        updatedDepartment.setId(1L);
        updatedDepartment.setName("IT Department Updated");
        
        DepartmentDto resultDto = new DepartmentDto();
        resultDto.setId(1L);
        resultDto.setName("IT Department Updated");
        
        when(departmentService.updateDepartment(eq(1L), any(DepartmentDto.class))).thenReturn(updatedDepartment);
        when(departmentService.convertToDto(updatedDepartment)).thenReturn(resultDto);
        
        // Act & Assert
        mockMvc.perform(put("/api/departments/1")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedDepartmentDto)))
            .andExpect(status().isOk());
        
        verify(departmentService).updateDepartment(eq(1L), any(DepartmentDto.class));
    }
    
    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testDeleteDepartment_WhenDepartmentExists_DeletesDepartment() throws Exception {
        // Arrange
        doNothing().when(departmentService).deleteDepartment(2L);
        
        // Act & Assert
        mockMvc.perform(delete("/api/departments/2")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(status().isNoContent());
        
        verify(departmentService).deleteDepartment(2L);
    }
    
    @Test
    @WithMockUser
    void testDeleteDepartment_WhenUnauthorized_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/departments/2")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(status().isForbidden());
        
        verify(departmentService, never()).deleteDepartment(anyLong());
    }
    
    @Test
    @WithMockUser(roles = {"HR_MANAGER"})
    void testMoveDepartment_WhenValidData_MovesDepartment() throws Exception {
        // Arrange
        Department movedDepartment = new Department();
        movedDepartment.setId(3L);
        movedDepartment.setName("Development");
        movedDepartment.setParentId(2L); // Moved to HR Department
        
        DepartmentDto movedDto = new DepartmentDto();
        movedDto.setId(3L);
        movedDto.setName("Development");
        movedDto.setParentId(2L);
        
        when(departmentService.moveDepartment(3L, 2L)).thenReturn(movedDepartment);
        when(departmentService.convertToDto(movedDepartment)).thenReturn(movedDto);
        
        // Act & Assert
        mockMvc.perform(put("/api/departments/3/move/2")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
            .andExpect(status().isOk());
        
        verify(departmentService).moveDepartment(3L, 2L);
    }
        
        @Test
        @WithMockUser(roles = {"HR_MANAGER"})
        void testMoveDepartment_WhenInvalidMove_ReturnsBadRequest() throws Exception {
            // Arrange
            when(departmentService.moveDepartment(3L, 4L))
                .thenThrow(new IllegalArgumentException("Cannot move department to its own child"));
            
            // Act & Assert
            mockMvc.perform(put("/api/departments/3/move/4")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cannot move department to its own child")));
            
            verify(departmentService).moveDepartment(3L, 4L);
        }
        
        @Test
        @WithMockUser
        void testMoveDepartment_WhenUnauthorized_ReturnsForbidden() throws Exception {
            // Act & Assert
            mockMvc.perform(put("/api/departments/3/move/2")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
            
            verify(departmentService, never()).moveDepartment(anyLong(), anyLong());
        }
        
        @Test
        @WithMockUser
        void testGetDepartmentByName_WhenDepartmentExists_ReturnsDepartment() throws Exception {
            // Arrange
            when(departmentService.getDepartmentByName("IT Department")).thenReturn(itDepartment);
            when(departmentService.convertToDto(itDepartment)).thenReturn(itDepartmentDto);
            
            // Act & Assert
            mockMvc.perform(get("/api/departments/by-name")
                    .param("name", "IT Department"))
                .andExpect(status().isOk());
            
            verify(departmentService).getDepartmentByName("IT Department");
        }
        
        @Test
        @WithMockUser
        void testGetDepartmentByName_WhenDepartmentDoesNotExist_ReturnsNotFound() throws Exception {
            // Arrange
            when(departmentService.getDepartmentByName("Non-existent Department"))
                .thenThrow(new EntityNotFoundException("Department not found with name: Non-existent Department"));
            
            // Act & Assert
            mockMvc.perform(get("/api/departments/by-name")
                    .param("name", "Non-existent Department"))
                .andExpect(status().isNotFound());
            
            verify(departmentService).getDepartmentByName("Non-existent Department");
        }
        
        @Test
        @WithMockUser(roles = {"ADMIN", "HR_MANAGER"})
        void testUpdateDepartment_WhenDepartmentDoesNotExist_ReturnsNotFound() throws Exception {
            // Arrange
            DepartmentDto updatedDepartmentDto = new DepartmentDto();
            updatedDepartmentDto.setName("Updated Department");
            
            when(departmentService.updateDepartment(eq(99L), any(DepartmentDto.class)))
                .thenThrow(new EntityNotFoundException("Department not found with id: 99"));
            
            // Act & Assert
            mockMvc.perform(put("/api/departments/99")
                    .with(SecurityMockMvcRequestPostProcessors.csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updatedDepartmentDto)))
                .andExpect(status().isNotFound());
            
            verify(departmentService).updateDepartment(eq(99L), any(DepartmentDto.class));
        }
        
        @Test
        @WithMockUser(roles = {"ADMIN"})
        void testDeleteDepartment_WhenDepartmentHasChildren_ReturnsBadRequest() throws Exception {
            // Arrange
            doThrow(new IllegalStateException("Cannot delete department with children"))
                .when(departmentService).deleteDepartment(1L);
            
            // Act & Assert
            mockMvc.perform(delete("/api/departments/1")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot delete department with children")));
            
            verify(departmentService).deleteDepartment(1L);
        }
        
        @Test
        @WithMockUser(roles = {"ADMIN"})
        void testDeleteDepartment_WhenDepartmentHasEmployees_ReturnsBadRequest() throws Exception {
            // Arrange
            doThrow(new IllegalStateException("Cannot delete department with employees"))
                .when(departmentService).deleteDepartment(2L);
            
            // Act & Assert
            mockMvc.perform(delete("/api/departments/2")
                    .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot delete department with employees")));
            
            verify(departmentService).deleteDepartment(2L);
        }
        
        @Test
        @WithMockUser(roles = {"ADMIN"})
        void testCreateDepartment_WhenNameExists_ReturnsBadRequest() throws Exception {
            // Arrange
            DepartmentDto newDepartmentDto = new DepartmentDto();
            newDepartmentDto.setName("IT Department"); // Name already exists
            
            when(departmentService.createDepartment(any(DepartmentDto.class)))
                .thenThrow(new IllegalArgumentException("Department name already exists: IT Department"));
            
            // Act & Assert
            mockMvc.perform(post("/api/departments")
                    .with(SecurityMockMvcRequestPostProcessors.csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(newDepartmentDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Department name already exists")));
            
            verify(departmentService).createDepartment(any(DepartmentDto.class));
        }
        
        @Test
        @WithMockUser(roles = {"HR_MANAGER"})
        void testUpdateDepartment_WhenNameExists_ReturnsBadRequest() throws Exception {
            // Arrange
            DepartmentDto updatedDepartmentDto = new DepartmentDto();
            updatedDepartmentDto.setName("HR Department"); // Name already exists for another department
            
            when(departmentService.updateDepartment(eq(1L), any(DepartmentDto.class)))
                .thenThrow(new IllegalArgumentException("Department name already exists: HR Department"));
            
            // Act & Assert
            mockMvc.perform(put("/api/departments/1")
                    .with(SecurityMockMvcRequestPostProcessors.csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updatedDepartmentDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Department name already exists")));
            
            verify(departmentService).updateDepartment(eq(1L), any(DepartmentDto.class));
        }
    }
