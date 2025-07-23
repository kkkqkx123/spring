package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.model.dto.DepartmentDto;
import com.example.demo.model.entity.Department;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.service.impl.DepartmentServiceImpl;

import jakarta.persistence.EntityNotFoundException;

/**
 * Unit tests for DepartmentService
 */
@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

    private Department itDepartment;
    private Department hrDepartment;
    private Department devDepartment;
    private Department supportDepartment;

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

        devDepartment = new Department();
        devDepartment.setId(3L);
        devDepartment.setName("Software Development");
        devDepartment.setParentId(1L);
        devDepartment.setParent(itDepartment);
        devDepartment.setDepPath("/1/3/");
        devDepartment.setIsParent(false);

        supportDepartment = new Department();
        supportDepartment.setId(4L);
        supportDepartment.setName("IT Support");
        supportDepartment.setParentId(1L);
        supportDepartment.setParent(itDepartment);
        supportDepartment.setDepPath("/1/4/");
        supportDepartment.setIsParent(false);

        // Set up parent-child relationships
        List<Department> itChildren = new ArrayList<>();
        itChildren.add(devDepartment);
        itChildren.add(supportDepartment);
        itDepartment.setChildren(itChildren);
    }

    @Test
    void testGetAllDepartments_ReturnsAllDepartments() {
        // Arrange
        List<Department> departments = Arrays.asList(itDepartment, hrDepartment, devDepartment, supportDepartment);
        when(departmentRepository.findAll()).thenReturn(departments);

        // Act
        List<Department> result = departmentService.getAllDepartments();

        // Assert
        assertEquals(4, result.size());
        verify(departmentRepository).findAll();
    }

    @Test
    void testGetDepartmentById_WhenDepartmentExists_ReturnsDepartment() {
        // Arrange
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(itDepartment));

        // Act
        Department result = departmentService.getDepartmentById(1L);

        // Assert
        assertEquals(itDepartment, result);
        verify(departmentRepository).findById(1L);
    }

    @Test
    void testGetDepartmentById_WhenDepartmentDoesNotExist_ThrowsException() {
        // Arrange
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(EntityNotFoundException.class, () -> {
            departmentService.getDepartmentById(99L);
        });
        verify(departmentRepository).findById(99L);
    }

    @Test
    void testCreateDepartment_WhenNameDoesNotExist_CreatesDepartment() {
        // Arrange
        DepartmentDto dto = new DepartmentDto();
        dto.setName("Finance Department");
        dto.setParentId(null);

        Department newDepartment = new Department();
        newDepartment.setName("Finance Department");

        Department savedDepartment = new Department();
        savedDepartment.setId(5L);
        savedDepartment.setName("Finance Department");

        when(departmentRepository.existsByName("Finance Department")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenReturn(savedDepartment);

        // Act
        Department result = departmentService.createDepartment(dto);

        // Assert
        assertEquals(5L, result.getId());
        assertEquals("Finance Department", result.getName());
        verify(departmentRepository).existsByName("Finance Department");
        verify(departmentRepository, times(2)).save(any(Department.class));
    }

    @Test
    void testCreateDepartment_WhenNameExists_ThrowsException() {
        // Arrange
        DepartmentDto dto = new DepartmentDto();
        dto.setName("IT Department");

        when(departmentRepository.existsByName("IT Department")).thenReturn(true);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            departmentService.createDepartment(dto);
        });
        verify(departmentRepository).existsByName("IT Department");
        verify(departmentRepository, never()).save(any(Department.class));
    }

    @Test
    void testCreateDepartment_WithParent_SetsDepartmentParent() {
        // Arrange
        DepartmentDto dto = new DepartmentDto();
        dto.setName("QA Team");
        dto.setParentId(3L);

        Department newDepartment = new Department();
        newDepartment.setName("QA Team");

        Department savedDepartment = new Department();
        savedDepartment.setId(6L);
        savedDepartment.setName("QA Team");
        savedDepartment.setParentId(3L);

        when(departmentRepository.existsByName("QA Team")).thenReturn(false);
        when(departmentRepository.findById(3L)).thenReturn(Optional.of(devDepartment));
        when(departmentRepository.save(any(Department.class))).thenReturn(savedDepartment);

        // Act
        Department result = departmentService.createDepartment(dto);

        // Assert
        assertEquals(6L, result.getId());
        assertEquals("QA Team", result.getName());
        assertEquals(3L, result.getParentId());
        verify(departmentRepository).existsByName("QA Team");
        verify(departmentRepository, times(2)).findById(3L); // Changed to times(2) since it's called twice
        verify(departmentRepository, times(2)).save(any(Department.class));
    }

    @Test
    void testUpdateDepartment_WhenDepartmentExists_UpdatesDepartment() {
        // Arrange
        DepartmentDto dto = new DepartmentDto();
        dto.setName("IT Department Updated");
        dto.setParentId(null);

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(itDepartment));
        when(departmentRepository.existsByName("IT Department Updated")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenReturn(itDepartment);

        // Act
        Department result = departmentService.updateDepartment(1L, dto);

        // Assert
        assertEquals("IT Department Updated", result.getName());
        verify(departmentRepository).findById(1L);
        verify(departmentRepository).existsByName("IT Department Updated");
        verify(departmentRepository).save(itDepartment);
    }

    @Test
    void testDeleteDepartment_WhenDepartmentHasNoChildrenOrEmployees_DeletesDepartment() {
        // Arrange
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(hrDepartment));
        when(departmentRepository.countEmployeesByDepartmentId(2L)).thenReturn(0L);

        // Act
        departmentService.deleteDepartment(2L);

        // Assert
        verify(departmentRepository).findById(2L);
        verify(departmentRepository).countEmployeesByDepartmentId(2L);
        verify(departmentRepository).delete(hrDepartment);
    }

    @Test
    void testDeleteDepartment_WhenDepartmentHasChildren_ThrowsException() {
        // Arrange
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(itDepartment));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            departmentService.deleteDepartment(1L);
        });
        verify(departmentRepository).findById(1L);
        verify(departmentRepository, never()).delete(any(Department.class));
    }

    @Test
    void testDeleteDepartment_WhenDepartmentHasEmployees_ThrowsException() {
        // Arrange
        when(departmentRepository.findById(2L)).thenReturn(Optional.of(hrDepartment));
        when(departmentRepository.countEmployeesByDepartmentId(2L)).thenReturn(5L);

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            departmentService.deleteDepartment(2L);
        });
        verify(departmentRepository).findById(2L);
        verify(departmentRepository).countEmployeesByDepartmentId(2L);
        verify(departmentRepository, never()).delete(any(Department.class));
    }

    @Test
    void testGetDepartmentTree_ReturnsDepartmentTree() {
        // Arrange
        List<Department> allDepartments = Arrays.asList(itDepartment, hrDepartment, devDepartment, supportDepartment);
        when(departmentRepository.findAll()).thenReturn(allDepartments);
        when(departmentRepository.countEmployeesByDepartmentId(anyLong())).thenReturn(0L);

        // Act
        List<DepartmentDto> result = departmentService.getDepartmentTree();

        // Assert
        assertEquals(2, result.size()); // Two root departments
        
        // Find IT department in result
        DepartmentDto itDto = result.stream()
                .filter(d -> d.getName().equals("IT Department"))
                .findFirst()
                .orElse(null);
        
        assertNotNull(itDto);
        assertEquals(2, itDto.getChildren().size()); // Two child departments
        
        verify(departmentRepository).findAll();
    }

    @Test
    void testConvertToDto_ConvertsDepartmentToDto() {
        // Arrange
        when(departmentRepository.countEmployeesByDepartmentId(1L)).thenReturn(10L);

        // Act
        DepartmentDto result = departmentService.convertToDto(itDepartment);

        // Assert
        assertEquals(1L, result.getId());
        assertEquals("IT Department", result.getName());
        assertEquals("/1/", result.getDepPath());
        assertEquals(true, result.getIsParent());
        assertEquals(10, result.getEmployeeCount());
        
        verify(departmentRepository).countEmployeesByDepartmentId(1L);
    }

    @Test
    void testConvertToEntity_ConvertsDtoToDepartment() {
        // Arrange
        DepartmentDto dto = new DepartmentDto();
        dto.setId(1L);
        dto.setName("IT Department");
        dto.setDepPath("/1/");
        dto.setIsParent(true);

        // Act
        Department result = departmentService.convertToEntity(dto);

        // Assert
        assertEquals(1L, result.getId());
        assertEquals("IT Department", result.getName());
        assertEquals("/1/", result.getDepPath());
        assertEquals(true, result.getIsParent());
    }
}