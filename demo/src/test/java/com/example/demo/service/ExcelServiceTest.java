package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
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
        
        // Set up repository mocks with lenient mode to avoid unnecessary stubbing errors
        lenient().when(departmentRepository.findByNameIgnoreCase("IT Department")).thenReturn(Optional.of(department));
        lenient().when(positionRepository.findByJobTitleIgnoreCase("Software Engineer")).thenReturn(Optional.of(position));
        lenient().when(departmentRepository.findAll()).thenReturn(List.of(department));
        lenient().when(positionRepository.findAll()).thenReturn(List.of(position));
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
            assertEquals("Employee Template", workbook.getSheetAt(0).getSheetName());
            assertTrue(workbook.getSheetAt(0).getPhysicalNumberOfRows() >= 2); // Header + sample row
            
            // Verify header row
            Row headerRow = workbook.getSheetAt(0).getRow(0);
            assertNotNull(headerRow);
            assertEquals("Employee Number*", headerRow.getCell(0).getStringCellValue());
            assertEquals("Name*", headerRow.getCell(1).getStringCellValue());
            
            // Verify sample data row
            Row sampleRow = workbook.getSheetAt(0).getRow(1);
            assertNotNull(sampleRow);
            assertTrue(sampleRow.getCell(0).getStringCellValue().length() > 0);
            assertTrue(sampleRow.getCell(1).getStringCellValue().length() > 0);
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
    void testValidateEmployeeData_WithDuplicates() {
        // Create employees with duplicate employee numbers and emails
        Employee emp1 = new Employee();
        emp1.setEmployeeNumber("EMP001");
        emp1.setName("John Doe");
        emp1.setEmail("same@example.com");
        emp1.setDepartment(department);
        
        Employee emp2 = new Employee();
        emp2.setEmployeeNumber("EMP001"); // Duplicate employee number
        emp2.setName("Jane Smith");
        emp2.setEmail("different@example.com");
        emp2.setDepartment(department);
        
        Employee emp3 = new Employee();
        emp3.setEmployeeNumber("EMP003");
        emp3.setName("Bob Johnson");
        emp3.setEmail("same@example.com"); // Duplicate email
        emp3.setDepartment(department);
        
        List<Employee> duplicateEmployees = List.of(emp1, emp2, emp3);
        
        Map<Integer, List<String>> errors = excelService.validateEmployeeData(duplicateEmployees);
        assertFalse(errors.isEmpty());
        assertEquals(2, errors.size());
        
        // Check for duplicate employee number error
        assertTrue(errors.get(2).stream().anyMatch(e -> e.contains("Duplicate employee number")));
        
        // Check for duplicate email error
        assertTrue(errors.get(3).stream().anyMatch(e -> e.contains("Duplicate email")));
    }
    
    @Test
    void testValidateEmployeeData_WithInvalidDates() {
        // Create employee with future dates
        Employee emp = new Employee();
        emp.setEmployeeNumber("EMP001");
        emp.setName("John Doe");
        emp.setDepartment(department);
        emp.setHireDate(LocalDate.now().plusDays(1)); // Future hire date
        emp.setBirthDate(LocalDate.now().minusYears(10)); // Too young (under 16)
        
        Map<Integer, List<String>> errors = excelService.validateEmployeeData(List.of(emp));
        assertFalse(errors.isEmpty());
        assertTrue(errors.get(1).stream().anyMatch(e -> e.contains("Hire date cannot be in the future")));
        assertTrue(errors.get(1).stream().anyMatch(e -> e.contains("Employee must be at least 16 years old")));
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
    
    @Test
    void testImportEmployeesFromExcel_ValidFile() throws IOException {
        // Create a valid Excel file with employee data
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Employees");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Employee Number*", "Name*", "Email", "Phone", "Department*", "Position", 
                    "Hire Date", "Status", "Gender", "Birth Date", "Address", "Salary",
                    "Emergency Contact Name", "Emergency Contact Phone", "Notes"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            // Create data row
            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("EMP001");
            dataRow.createCell(1).setCellValue("John Doe");
            dataRow.createCell(2).setCellValue("john.doe@example.com");
            dataRow.createCell(3).setCellValue("+1234567890");
            dataRow.createCell(4).setCellValue("IT Department");
            dataRow.createCell(5).setCellValue("Software Engineer");
            dataRow.createCell(6).setCellValue("2020-01-01");
            dataRow.createCell(7).setCellValue("Active");
            dataRow.createCell(8).setCellValue("Male");
            dataRow.createCell(9).setCellValue("1990-01-01");
            
            workbook.write(bos);
        }
        
        MultipartFile file = new MockMultipartFile("file", "employees.xlsx", 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bos.toByteArray());
        
        // Test import
        List<Employee> importedEmployees = excelService.importEmployeesFromExcel(file);
        
        // Verify
        assertNotNull(importedEmployees);
        assertEquals(1, importedEmployees.size());
        assertEquals("EMP001", importedEmployees.get(0).getEmployeeNumber());
        assertEquals("John Doe", importedEmployees.get(0).getName());
        assertEquals("john.doe@example.com", importedEmployees.get(0).getEmail());
        assertEquals(department, importedEmployees.get(0).getDepartment());
        assertEquals(position, importedEmployees.get(0).getPosition());
        assertEquals(LocalDate.of(2020, 1, 1), importedEmployees.get(0).getHireDate());
        assertEquals(EmployeeStatus.ACTIVE, importedEmployees.get(0).getStatus());
        assertEquals(Gender.MALE, importedEmployees.get(0).getGender());
    }
    
    @Test
    void testImportEmployeesFromExcel_InvalidData() throws IOException {
        // Create an Excel file with invalid employee data
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Employees");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Employee Number*", "Name*", "Email", "Phone", "Department*", "Position", 
                    "Hire Date", "Status", "Gender", "Birth Date", "Address", "Salary",
                    "Emergency Contact Name", "Emergency Contact Phone", "Notes"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            // Create data row with invalid email
            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("EMP001");
            dataRow.createCell(1).setCellValue("John Doe");
            dataRow.createCell(2).setCellValue("invalid-email"); // Invalid email
            dataRow.createCell(3).setCellValue("+1234567890");
            dataRow.createCell(4).setCellValue("IT Department");
            dataRow.createCell(5).setCellValue("Software Engineer");
            
            // Create data row with missing required fields
            Row dataRow2 = sheet.createRow(2);
            dataRow2.createCell(0).setCellValue(""); // Missing employee number
            dataRow2.createCell(1).setCellValue("Jane Smith");
            dataRow2.createCell(2).setCellValue("jane.smith@example.com");
            
            workbook.write(bos);
        }
        
        MultipartFile file = new MockMultipartFile("file", "employees.xlsx", 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bos.toByteArray());
        
        // Test import with validation errors
        Exception exception = assertThrows(ImportValidationException.class, () -> {
            excelService.importEmployeesFromExcel(file);
        });
        
        assertTrue(exception instanceof ImportValidationException);
        ImportValidationException importException = (ImportValidationException) exception;
        assertNotNull(importException.getValidationErrors());
        assertFalse(importException.getValidationErrors().isEmpty());
    }
}