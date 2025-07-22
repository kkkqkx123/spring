package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.model.dto.PositionDto;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.PositionRepository;
import com.example.demo.service.impl.PositionServiceImpl;

import jakarta.persistence.EntityNotFoundException;

/**
 * Unit tests for PositionService
 */
@ExtendWith(MockitoExtension.class)
class PositionServiceTest {

    @Mock
    private PositionRepository positionRepository;
    
    @Mock
    private DepartmentRepository departmentRepository;
    
    @InjectMocks
    private PositionServiceImpl positionService;
    
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
    }
    
    @Test
    void testGetAllPositions_ReturnsAllPositions() {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(positionRepository.findAll()).thenReturn(positions);
        
        // Act
        List<Position> result = positionService.getAllPositions();
        
        // Assert
        assertEquals(1, result.size());
        assertEquals("Software Engineer", result.get(0).getJobTitle());
        verify(positionRepository).findAll();
    }
    
    @Test
    void testGetPositionById_WhenPositionExists_ReturnsPosition() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        
        // Act
        Position result = positionService.getPositionById(1L);
        
        // Assert
        assertNotNull(result);
        assertEquals("Software Engineer", result.getJobTitle());
        verify(positionRepository).findById(1L);
    }
    
    @Test
    void testGetPositionById_WhenPositionDoesNotExist_ThrowsException() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> positionService.getPositionById(1L));
        verify(positionRepository).findById(1L);
    }
    
    @Test
    void testGetPositionByJobTitle_WhenPositionExists_ReturnsPosition() {
        // Arrange
        when(positionRepository.findByJobTitle("Software Engineer")).thenReturn(Optional.of(position));
        
        // Act
        Position result = positionService.getPositionByJobTitle("Software Engineer");
        
        // Assert
        assertNotNull(result);
        assertEquals("Software Engineer", result.getJobTitle());
        verify(positionRepository).findByJobTitle("Software Engineer");
    }
    
    @Test
    void testGetPositionByJobTitle_WhenPositionDoesNotExist_ThrowsException() {
        // Arrange
        when(positionRepository.findByJobTitle("Non-existent Position")).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> positionService.getPositionByJobTitle("Non-existent Position"));
        verify(positionRepository).findByJobTitle("Non-existent Position");
    }
    
    @Test
    void testCreatePosition_WhenJobTitleDoesNotExist_CreatesPosition() {
        // Arrange
        when(positionRepository.existsByJobTitle("Software Engineer")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(positionRepository.save(any(Position.class))).thenReturn(position);
        
        // Act
        Position result = positionService.createPosition(positionDto);
        
        // Assert
        assertNotNull(result);
        assertEquals("Software Engineer", result.getJobTitle());
        verify(positionRepository).existsByJobTitle("Software Engineer");
        verify(departmentRepository).findById(1L);
        verify(positionRepository).save(any(Position.class));
    }
    
    @Test
    void testCreatePosition_WhenJobTitleExists_ThrowsException() {
        // Arrange
        when(positionRepository.existsByJobTitle("Software Engineer")).thenReturn(true);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> positionService.createPosition(positionDto));
        verify(positionRepository).existsByJobTitle("Software Engineer");
        verify(positionRepository, never()).save(any(Position.class));
    }
    
    @Test
    void testCreatePosition_WhenInvalidSalaryRange_ThrowsException() {
        // Arrange
        positionDto.setSalaryMin(90000.0);
        positionDto.setSalaryMax(80000.0);
        when(positionRepository.existsByJobTitle("Software Engineer")).thenReturn(false);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> positionService.createPosition(positionDto));
        verify(positionRepository).existsByJobTitle("Software Engineer");
        verify(positionRepository, never()).save(any(Position.class));
    }
    
    @Test
    void testUpdatePosition_WhenPositionExistsAndJobTitleNotChanged_UpdatesPosition() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(positionRepository.save(any(Position.class))).thenReturn(position);
        
        // Act
        Position result = positionService.updatePosition(1L, positionDto);
        
        // Assert
        assertNotNull(result);
        assertEquals("Software Engineer", result.getJobTitle());
        verify(positionRepository).findById(1L);
        verify(positionRepository).save(any(Position.class));
    }
    
    @Test
    void testUpdatePosition_WhenPositionExistsAndJobTitleChanged_UpdatesPosition() {
        // Arrange
        positionDto.setJobTitle("Senior Software Engineer");
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(positionRepository.existsByJobTitle("Senior Software Engineer")).thenReturn(false);
        when(positionRepository.save(any(Position.class))).thenReturn(position);
        
        // Act
        Position result = positionService.updatePosition(1L, positionDto);
        
        // Assert
        assertNotNull(result);
        verify(positionRepository).findById(1L);
        verify(positionRepository).existsByJobTitle("Senior Software Engineer");
        verify(positionRepository).save(any(Position.class));
    }
    
    @Test
    void testUpdatePosition_WhenJobTitleExistsForAnotherPosition_ThrowsException() {
        // Arrange
        positionDto.setJobTitle("Senior Software Engineer");
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(positionRepository.existsByJobTitle("Senior Software Engineer")).thenReturn(true);
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> positionService.updatePosition(1L, positionDto));
        verify(positionRepository).findById(1L);
        verify(positionRepository).existsByJobTitle("Senior Software Engineer");
        verify(positionRepository, never()).save(any(Position.class));
    }
    
    @Test
    void testUpdatePosition_WhenInvalidSalaryRange_ThrowsException() {
        // Arrange
        positionDto.setSalaryMin(90000.0);
        positionDto.setSalaryMax(80000.0);
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> positionService.updatePosition(1L, positionDto));
        verify(positionRepository).findById(1L);
        verify(positionRepository, never()).save(any(Position.class));
    }
    
    @Test
    void testUpdatePosition_WhenDepartmentChanged_UpdatesPosition() {
        // Arrange
        Department newDepartment = new Department();
        newDepartment.setId(2L);
        newDepartment.setName("HR Department");
        
        positionDto.setDepartmentId(2L);
        
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(newDepartment));
        when(positionRepository.save(any(Position.class))).thenReturn(position);
        
        // Act
        Position result = positionService.updatePosition(1L, positionDto);
        
        // Assert
        assertNotNull(result);
        verify(positionRepository).findById(1L);
        verify(departmentRepository).findById(2L);
        verify(positionRepository).save(any(Position.class));
    }
    
    @Test
    void testDeletePosition_WhenPositionExistsAndHasNoEmployees_DeletesPosition() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(positionRepository.countEmployeesByPositionId(1L)).thenReturn(0L);
        
        // Act
        positionService.deletePosition(1L);
        
        // Assert
        verify(positionRepository).findById(1L);
        verify(positionRepository).countEmployeesByPositionId(1L);
        verify(positionRepository).delete(position);
    }
    
    @Test
    void testDeletePosition_WhenPositionHasEmployees_ThrowsException() {
        // Arrange
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(positionRepository.countEmployeesByPositionId(1L)).thenReturn(2L);
        
        // Act & Assert
        assertThrows(IllegalStateException.class, () -> positionService.deletePosition(1L));
        verify(positionRepository).findById(1L);
        verify(positionRepository).countEmployeesByPositionId(1L);
        verify(positionRepository, never()).delete(any(Position.class));
    }
    
    @Test
    void testGetPositionsByDepartmentId_WhenDepartmentExists_ReturnsPositions() {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(departmentRepository.existsById(1L)).thenReturn(true);
        when(positionRepository.findByDepartmentId(1L)).thenReturn(positions);
        
        // Act
        List<Position> result = positionService.getPositionsByDepartmentId(1L);
        
        // Assert
        assertEquals(1, result.size());
        assertEquals("Software Engineer", result.get(0).getJobTitle());
        verify(departmentRepository).existsById(1L);
        verify(positionRepository).findByDepartmentId(1L);
    }
    
    @Test
    void testGetPositionsByDepartmentId_WhenDepartmentDoesNotExist_ThrowsException() {
        // Arrange
        when(departmentRepository.existsById(1L)).thenReturn(false);
        
        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> positionService.getPositionsByDepartmentId(1L));
        verify(departmentRepository).existsById(1L);
        verify(positionRepository, never()).findByDepartmentId(anyLong());
    }
    
    @Test
    void testSearchPositions_WhenSearchTermProvided_ReturnsMatchingPositions() {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(positionRepository.searchByTitleContaining("engineer")).thenReturn(positions);
        
        // Act
        List<Position> result = positionService.searchPositions("engineer");
        
        // Assert
        assertEquals(1, result.size());
        assertEquals("Software Engineer", result.get(0).getJobTitle());
        verify(positionRepository).searchByTitleContaining("engineer");
    }
    
    @Test
    void testSearchPositions_WhenSearchTermIsNull_ReturnsAllPositions() {
        // Arrange
        List<Position> positions = Arrays.asList(position);
        when(positionRepository.findAll()).thenReturn(positions);
        
        // Act
        List<Position> result = positionService.searchPositions(null);
        
        // Assert
        assertEquals(1, result.size());
        assertEquals("Software Engineer", result.get(0).getJobTitle());
        verify(positionRepository).findAll();
        verify(positionRepository, never()).searchByTitleContaining(anyString());
    }
    
    @Test
    void testHasEmployees_WhenPositionHasEmployees_ReturnsTrue() {
        // Arrange
        when(positionRepository.countEmployeesByPositionId(1L)).thenReturn(2L);
        
        // Act
        boolean result = positionService.hasEmployees(1L);
        
        // Assert
        assertTrue(result);
        verify(positionRepository).countEmployeesByPositionId(1L);
    }
    
    @Test
    void testHasEmployees_WhenPositionHasNoEmployees_ReturnsFalse() {
        // Arrange
        when(positionRepository.countEmployeesByPositionId(1L)).thenReturn(0L);
        
        // Act
        boolean result = positionService.hasEmployees(1L);
        
        // Assert
        assertFalse(result);
        verify(positionRepository).countEmployeesByPositionId(1L);
    }
    
    @Test
    void testConvertToDto_ConvertsPositionToDto() {
        // Arrange
        when(positionRepository.countEmployeesByPositionId(1L)).thenReturn(2L);
        
        // Act
        PositionDto result = positionService.convertToDto(position);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Software Engineer", result.getJobTitle());
        assertEquals("Senior Developer", result.getProfessionalTitle());
        assertEquals("Develops software applications", result.getDescription());
        assertEquals(1L, result.getDepartmentId());
        assertEquals("IT Department", result.getDepartmentName());
        assertEquals(50000.0, result.getSalaryMin());
        assertEquals(80000.0, result.getSalaryMax());
        assertTrue(result.getIsActive());
        assertEquals(2, result.getEmployeeCount());
        verify(positionRepository).countEmployeesByPositionId(1L);
    }
    
    @Test
    void testConvertToEntity_ConvertsDtoToPosition() {
        // Arrange
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        
        // Act
        Position result = positionService.convertToEntity(positionDto);
        
        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Software Engineer", result.getJobTitle());
        assertEquals("Senior Developer", result.getProfessionalTitle());
        assertEquals("Develops software applications", result.getDescription());
        assertEquals(1L, result.getDepartment().getId());
        assertEquals(50000.0, result.getSalaryMin());
        assertEquals(80000.0, result.getSalaryMax());
        assertTrue(result.getIsActive());
        verify(departmentRepository).findById(1L);
    }
    
    @Test
    void testConvertToEntity_WhenDepartmentNotFound_ThrowsException() {
        // Arrange
        when(departmentRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> positionService.convertToEntity(positionDto));
        verify(departmentRepository).findById(1L);
    }
}