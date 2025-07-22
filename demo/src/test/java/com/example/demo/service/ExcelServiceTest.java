package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.exception.ImportValidationException;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.Employee.Gender;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.PositionRepository;
import com.example.demo.service.impl.ExcelServiceImpl;

@ExtendWith(MockitoExtension.class)
class ExcelServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;
    
    @Mock
    private PositionRepository positionRepository;
    
    @InjectMocks
    private ExcelServiceImpl excelService;
    
    private Department department;
    private Position position;
    private List<Employee> employees;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        department = new Department();
        department.setId(1L);
        department.setName("IT Department");
        
        position = new Position();
        position.setId(1L);
        position.setJobTitle("Software Engineer");
        
        Employee employee1 = new Employee();
        employee1.setId(1L);
        employee1.setEmployeeNumber("EMP001");
        employee1.setName("John Doe");
        employee1.setEmail("john.doe@example.com");
        employee1.setPhone("+1234567890");
        employee1.setDepartment(department);
        employee1.setPosition(position);
        employee1.setHireDate(LocalDate.of(2020, 1, 1));
        employee1.setStatus(EmployeeStatus.ACTIVE);
        employee1.setGender(Gender.MALE);
        employee1.setBirthDate(LocalDate.of(1990, 1, 1));
        employee1.setAddress("123 Main St");
        employee1.setSalary(new BigDecimal("50000.00"));
        
        Employee employee2 = new Employee();
        employee2.setId(2L);
        employee2.setEmployeeNumber("EMP002");
        employee2.setName("Jane Smith");
        employee2.setEmail("jane.smith@example.com");
        employee2.setPhone("+1987654321");
        employee2.setDepartment(department);
        employee2.setPosition(position);
        employee2.setHireDate(LocalDate.of(2021, 1, 1));
        employee2.setStatus(EmployeeStatus.ACTIVE);
        employee2.setGender(Gender.FEMALE);
        
        employees = new ArrayList<>();
        employees.add(employee1);
        employees.add(employee2);
        
        // Set up repository mocks
        when(departmentRepository.findByNameIgnoreCase("IT Department")).thenReturn(Optional.of(department));
        when(positionRepository.findByJobTitleIgnoreCase("Software Engineer")).thenReturn(Optional.of(position));
        when(departmentRepository.findAll()).thenReturn(List.of(department));
        when(positionRepository.findAll()).thenReturn(List.of(position));
    }
    
    @Test
    void testExportEmployeesToExcel() throws IOException {
        // Test export functionality
        byte[] excelData = excelService.exportEmployeesToExcel(employees);
        
        // Verify export result
        assertNotNull(excelData);
        assertTrue(excelData.length > 0);
        
        // Verify workbook structure
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelData))) {
            assertEquals(1, workbook.getNumberOfSheets());
            assertEquals("Employees", workbook.getSheetAt(0).getSheetName());
            assertEquals(3, workbook.getSheetAt(0).getPhysicalNumberOfRows()); // Header + 2 employees
        }
    }
    
    @Test
    void testGetEmployeeImportTemplate() throws IOException {
        // Test template generation
        byte[] templateData = excelService.getEmployeeImportTemplate();
        
        // Verify template result
        assertNotNull(templateData);
        assertTrue(templateData.length > 0);
        
        // Verify workbook structure
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(templateData))) {
            assertEquals(1, workbook.getNumberOfSheets());
            assertEquals("Employee Import Template", workbook.getSheetAt(0).getSheetName());
            assertTrue(workbook.getSheetAt(0).getPhysicalNumberOfRows() >= 2); // Header + sample row
        }
    }
    
    @Test
    void testValidateEmployeeData() {
        // Test with valid employees
        Map<Integer, List<String>> validationErrors = excelService.validateEmployeeData(employees);
        assertTrue(validationErrors.isEmpty());
        
        // Test with invalid employee
        Employee invalidEmployee = new Employee();
        invalidEmployee.setEmail("invalid-email"); // Invalid email format
        
        Map<Integer, List<String>> errors = excelService.validateEmployeeData(List.of(invalidEmployee));
        assertFalse(errors.isEmpty());
        assertTrue(errors.containsKey(1)); // First row has errors
        assertTrue(errors.get(1).stream().anyMatch(e -> e.contains("Employee number is required")));
        assertTrue(errors.get(1).stream().anyMatch(e -> e.contains("Name is required")));
        assertTrue(errors.get(1).stream().anyMatch(e -> e.contains("Department is required")));
        assertTrue(errors.get(1).stream().anyMatch(e -> e.contains("Invalid email format")));
    }
    
    @Test
    void testImportEmployeesFromExcel_EmptyFile() {
        // Test with empty file
        MultipartFile emptyFile = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);
        
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            excelService.importEmployeesFromExcel(emptyFile);
        });
        
        assertEquals("File is empty", exception.getMessage());
    }
    
    @Test
    void testImportEmployeesFromExcel_InvalidFileExtension() {
        // Test with invalid file extension
        MultipartFile invalidFile = new MockMultipartFile("file", "test.txt", "text/plain", "test".getBytes());
        
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            excelService.importEmployeesFromExcel(invalidFile);
        });
        
        assertEquals("Only .xlsx files are supported", exception.getMessage());
    }
}