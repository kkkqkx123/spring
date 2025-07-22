package com.example.demo.controller;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import com.example.demo.model.dto.PositionDto;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Position;
import com.example.demo.service.PositionService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityNotFoundException;

/**
 * Unit tests for PositionController
 */
@WebMvcTest(PositionController.class)
class PositionControllerTest {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private PositionService positionService;
    
    private Position position;
    private PositionDto positionDto;
    private Department department;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        department = new Department();
        department.setId(1L);
        department.setName("IT Department");
        
        position = new Position();
        position.setId(1L);
        position.setJobTitle("Software Engineer");
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(department);
        position.setSalaryMin(50000.0);
        position.setSalaryMax(80000.0);
        position.setIsActive(true);
        
        positionDto = new PositionDto();
        positionDto.setId(1L);
        positionDto.setJobTitle("Software Engineer");
        positionDto.setProfessionalTitle("Senior Developer");
        positionDto.setDescription("Develops software applications");
        positionDto.setDepartmentId(1L);
        positionDto.setDepartmentName("IT Department");
        positionDto.setSalaryMin(50000.0);
        positionDto.setSalaryMax(80000.0);
        positionDto.setIsActive(true);
        positionDto.setEmployeeCount(0);
    }
    
    @Test
    @WithMockUser
    void testGetAllPositions_ReturnsAllPositions() throws Exception {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(positionService.getAllPositions()).thenReturn(positions);
        when(positionService.convertToDto(any(Position.class))).thenReturn(positionDto);
        
        // Act & Assert
        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].jobTitle", is("Software Engineer")))
                .andExpect(jsonPath("$[0].professionalTitle", is("Senior Developer")));
        
        verify(positionService).getAllPositions();
        verify(positionService).convertToDto(any(Position.class));
    }
    
    @Test
    @WithMockUser
    void testGetPositionById_WhenPositionExists_ReturnsPosition() throws Exception {
        // Arrange
        when(positionService.getPositionById(1L)).thenReturn(position);
        when(positionService.convertToDto(position)).thenReturn(positionDto);
        
        // Act & Assert
        mockMvc.perform(get("/api/positions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle", is("Software Engineer")))
                .andExpect(jsonPath("$.professionalTitle", is("Senior Developer")));
        
        verify(positionService).getPositionById(1L);
        verify(positionService).convertToDto(position);
    }
    
    @Test
    @WithMockUser
    void testGetPositionById_WhenPositionDoesNotExist_ReturnsNotFound() throws Exception {
        // Arrange
        when(positionService.getPositionById(1L)).thenThrow(new EntityNotFoundException("Position not found"));
        
        // Act & Assert
        mockMvc.perform(get("/api/positions/1"))
                .andExpect(status().isNotFound());
        
        verify(positionService).getPositionById(1L);
    }
    
    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreatePosition_WhenValidData_CreatesPosition() throws Exception {
        // Arrange
        when(positionService.createPosition(any(PositionDto.class))).thenReturn(position);
        when(positionService.convertToDto(position)).thenReturn(positionDto);
        
        // Act & Assert
        mockMvc.perform(post("/api/positions")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(positionDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.jobTitle", is("Software Engineer")))
                .andExpect(jsonPath("$.professionalTitle", is("Senior Developer")));
        
        verify(positionService).createPosition(any(PositionDto.class));
        verify(positionService).convertToDto(position);
    }
    
    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreatePosition_WhenInvalidData_ReturnsBadRequest() throws Exception {
        // Arrange
        positionDto.setJobTitle(null); // Invalid: job title is required
        
        // Act & Assert
        mockMvc.perform(post("/api/positions")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(positionDto)))
                .andExpect(status().isBadRequest());
        
        verify(positionService, never()).createPosition(any(PositionDto.class));
    }
    
    @Test
    @WithMockUser
    void testCreatePosition_WhenUnauthorized_ReturnsForbidden() throws Exception {
        // Mock the security to throw AccessDeniedException
        when(positionService.createPosition(any(PositionDto.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied"));
            
        // Act & Assert
        mockMvc.perform(post("/api/positions")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(positionDto)))
                .andExpect(status().isForbidden());
        
        verify(positionService).createPosition(any(PositionDto.class));
    }
    
    @Test
    @WithMockUser(roles = {"HR_MANAGER"})
    void testUpdatePosition_WhenValidData_UpdatesPosition() throws Exception {
        // Arrange
        when(positionService.updatePosition(eq(1L), any(PositionDto.class))).thenReturn(position);
        when(positionService.convertToDto(position)).thenReturn(positionDto);
        
        // Act & Assert
        mockMvc.perform(put("/api/positions/1")
                .with(SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(positionDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle", is("Software Engineer")))
                .andExpect(jsonPath("$.professionalTitle", is("Senior Developer")));
        
        verify(positionService).updatePosition(eq(1L), any(PositionDto.class));
        verify(positionService).convertToDto(position);
    }
    
    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testDeletePosition_WhenPositionExists_DeletesPosition() throws Exception {
        // Arrange
        doNothing().when(positionService).deletePosition(1L);
        
        // Act & Assert
        mockMvc.perform(delete("/api/positions/1")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());
        
        verify(positionService).deletePosition(1L);
    }
    
    @Test
    @WithMockUser
    void testDeletePosition_WhenUnauthorized_ReturnsForbidden() throws Exception {
        // Mock the security to throw AccessDeniedException
        doThrow(new org.springframework.security.access.AccessDeniedException("Access denied"))
            .when(positionService).deletePosition(anyLong());
            
        // Act & Assert
        mockMvc.perform(delete("/api/positions/1")
                .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isForbidden());
        
        verify(positionService).deletePosition(anyLong());
    }
    
    @Test
    @WithMockUser
    void testGetPositionsByDepartmentId_ReturnsPositionsInDepartment() throws Exception {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(positionService.getPositionsByDepartmentId(1L)).thenReturn(positions);
        when(positionService.convertToDto(any(Position.class))).thenReturn(positionDto);
        
        // Act & Assert
        mockMvc.perform(get("/api/positions/department/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].jobTitle", is("Software Engineer")));
        
        verify(positionService).getPositionsByDepartmentId(1L);
        verify(positionService).convertToDto(any(Position.class));
    }
    
    @Test
    @WithMockUser
    void testSearchPositions_ReturnsMatchingPositions() throws Exception {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(positionService.searchPositions("engineer")).thenReturn(positions);
        when(positionService.convertToDto(any(Position.class))).thenReturn(positionDto);
        
        // Act & Assert
        mockMvc.perform(get("/api/positions/search")
                .param("searchTerm", "engineer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].jobTitle", is("Software Engineer")));
        
        verify(positionService).searchPositions("engineer");
        verify(positionService).convertToDto(any(Position.class));
    }
    
    @Test
    @WithMockUser(roles = {"HR_MANAGER"})
    void testHasEmployees_WhenPositionHasNoEmployees_ReturnsFalse() throws Exception {
        // Arrange
        when(positionService.hasEmployees(1L)).thenReturn(false);
        
        // Act & Assert
        mockMvc.perform(get("/api/positions/1/has-employees"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
        
        verify(positionService).hasEmployees(1L);
    }
    
    @Test
    @WithMockUser(roles = {"HR_MANAGER"})
    void testHasEmployees_WhenPositionHasEmployees_ReturnsTrue() throws Exception {
        // Arrange
        when(positionService.hasEmployees(1L)).thenReturn(true);
        
        // Act & Assert
        mockMvc.perform(get("/api/positions/1/has-employees"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
        
        verify(positionService).hasEmployees(1L);
    }
}