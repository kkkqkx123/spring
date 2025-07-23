package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.service.impl.EmployeeServiceImpl;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceExcelTest {

    @Mock
    private EmployeeRepository employeeRepository;
    
    @Mock
    private ExcelService excelService;
    
    @InjectMocks
    private EmployeeServiceImpl employeeService;
    
    private List<Employee> employees;
    private MultipartFile excelFile;
    private byte[] excelData;
    
    @BeforeEach
    void setUp() {
        // Set up test data
        Department department = new Department();
        department.setId(1L);
        department.setName("IT Department");
        
        Employee employee1 = new Employee();
        employee1.setId(1L);
        employee1.setEmployeeNumber("EMP001");
        employee1.setName("John Doe");
        employee1.setDepartment(department);
        
        Employee employee2 = new Employee();
        employee2.setId(2L);
        employee2.setEmployeeNumber("EMP002");
        employee2.setName("Jane Smith");
        employee2.setDepartment(department);
        
        employees = new ArrayList<>();
        employees.add(employee1);
        employees.add(employee2);
        
        excelFile = new MockMultipartFile("file", "employees.xlsx", 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "test".getBytes());
        
        excelData = "test".getBytes();
    }
    
    @Test
    void testImportEmployeesFromExcel() throws IOException {
        // Mock ExcelService with lenient mode to avoid unnecessary stubbing errors
        lenient().when(excelService.importEmployeesFromExcel(any(MultipartFile.class))).thenReturn(employees);
        
        // Mock EmployeeRepository for createEmployee method
        lenient().when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(employeeRepository.existsByEmployeeNumber(anyString())).thenReturn(false);
        lenient().when(employeeRepository.existsByEmail(anyString())).thenReturn(false);
        
        // Test import
        List<Employee> importedEmployees = employeeService.importEmployeesFromExcel(excelFile);
        
        // Verify
        assertNotNull(importedEmployees);
        assertEquals(2, importedEmployees.size());
        verify(excelService, times(1)).importEmployeesFromExcel(excelFile);
        verify(employeeRepository, times(2)).save(any(Employee.class));
    }
    
    @Test
    void testExportEmployeesToExcel_AllEmployees() throws IOException {
        // Mock repository
        when(employeeRepository.findAll()).thenReturn(employees);
        
        // Mock ExcelService
        when(excelService.exportEmployeesToExcel(employees)).thenReturn(excelData);
        
        // Test export all employees
        byte[] exportedData = employeeService.exportEmployeesToExcel(null);
        
        // Verify
        assertNotNull(exportedData);
        assertEquals(excelData, exportedData);
        verify(employeeRepository, times(1)).findAll();
        verify(excelService, times(1)).exportEmployeesToExcel(employees);
    }
    
    @Test
    void testExportEmployeesToExcel_SelectedEmployees() throws IOException {
        // Mock repository
        List<Long> employeeIds = List.of(1L, 2L);
        when(employeeRepository.findByIdIn(employeeIds)).thenReturn(employees);
        
        // Mock ExcelService
        when(excelService.exportEmployeesToExcel(employees)).thenReturn(excelData);
        
        // Test export selected employees
        byte[] exportedData = employeeService.exportEmployeesToExcel(employeeIds);
        
        // Verify
        assertNotNull(exportedData);
        assertEquals(excelData, exportedData);
        verify(employeeRepository, times(1)).findByIdIn(employeeIds);
        verify(excelService, times(1)).exportEmployeesToExcel(employees);
    }
    
    @Test
    void testGetEmployeeImportTemplate() throws IOException {
        // Mock ExcelService
        when(excelService.getEmployeeImportTemplate()).thenReturn(excelData);
        
        // Test get template
        byte[] templateData = employeeService.getEmployeeImportTemplate();
        
        // Verify
        assertNotNull(templateData);
        assertEquals(excelData, templateData);
        verify(excelService, times(1)).getEmployeeImportTemplate();
    }
}