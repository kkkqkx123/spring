package com.example.demo.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.exception.ImportValidationException;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Employee.EmployeeStatus;
import com.example.demo.model.entity.Employee.Gender;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.PositionRepository;
import com.example.demo.service.ExcelService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of ExcelService for handling Excel import/export operations
 */
@Service
@Slf4j
public class ExcelServiceImpl implements ExcelService {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    
    // Date formatter for Excel
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    // Excel column headers
    private static final String[] HEADERS = {
        "Employee Number*", "Name*", "Email", "Phone", "Department*", "Position", 
        "Hire Date", "Status", "Gender", "Birth Date", "Address", "Salary",
        "Emergency Contact Name", "Emergency Contact Phone", "Notes"
    };
    
    // Required field indices
    private static final int EMPLOYEE_NUMBER_IDX = 0;
    private static final int NAME_IDX = 1;
    private static final int EMAIL_IDX = 2;
    private static final int PHONE_IDX = 3;
    private static final int DEPARTMENT_IDX = 4;
    private static final int POSITION_IDX = 5;
    private static final int HIRE_DATE_IDX = 6;
    private static final int STATUS_IDX = 7;
    private static final int GENDER_IDX = 8;
    private static final int BIRTH_DATE_IDX = 9;
    private static final int ADDRESS_IDX = 10;
    private static final int SALARY_IDX = 11;
    private static final int EMERGENCY_CONTACT_NAME_IDX = 12;
    private static final int EMERGENCY_CONTACT_PHONE_IDX = 13;
    private static final int NOTES_IDX = 14;
    
    public ExcelServiceImpl(DepartmentRepository departmentRepository, PositionRepository positionRepository) {
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
    }
    @Override
    public List<Employee> importEmployeesFromExcel(MultipartFile file) throws IOException {
        log.info("Importing employees from Excel file: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        // Check file extension
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are supported");
        }
        
        List<Employee> employees = new ArrayList<>();
        Map<Integer, List<String>> validationErrors = new HashMap<>();
        
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            // Validate sheet structure
            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getPhysicalNumberOfCells() < 5) {
                throw new IllegalArgumentException("Invalid Excel format: Missing header row or required columns");
            }
            
            // Validate header row
            boolean validHeader = true;
            for (int i = 0; i < Math.min(HEADERS.length, headerRow.getPhysicalNumberOfCells()); i++) {
                Cell cell = headerRow.getCell(i);
                String headerValue = getCellValueAsString(cell);
                if (headerValue == null || !headerValue.replace("*", "").trim().equalsIgnoreCase(HEADERS[i].replace("*", "").trim())) {
                    validHeader = false;
                    break;
                }
            }
            
            if (!validHeader) {
                throw new IllegalArgumentException("Invalid Excel format: Header row does not match expected format. Please use the template.");
            }
            
            // Process data rows
            int rowIndex = 1;
            int totalRows = 0;
            int successRows = 0;
            
            for (Row row : sheet) {
                // Skip header row
                if (row.getRowNum() == 0) {
                    continue;
                }
                
                // Skip empty rows
                if (isRowEmpty(row)) {
                    continue;
                }
                
                totalRows++;
                try {
                    Employee employee = parseEmployeeFromRow(row);
                    employees.add(employee);
                    successRows++;
                } catch (Exception e) {
                    List<String> errors = validationErrors.getOrDefault(rowIndex, new ArrayList<>());
                    errors.add(e.getMessage());
                    validationErrors.put(rowIndex, errors);
                    log.error("Error parsing row {}: {}", rowIndex, e.getMessage());
                }
                
                rowIndex++;
            }
            
            log.info("Processed {} rows: {} successful, {} with errors", 
                    totalRows, successRows, validationErrors.size());
        }
        
        // If there are validation errors, throw exception with detailed report
        if (!validationErrors.isEmpty()) {
            throw new ImportValidationException("Validation errors occurred during import", validationErrors);
        }
        
        return employees;
    }
    
    @Override
    public byte[] exportEmployeesToExcel(List<Employee> employees) throws IOException {
        log.info("Exporting {} employees to Excel", employees.size());
        
        try (Workbook workbook = new XSSFWorkbook(); 
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Employees");
            
            // Create header row with styles
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            
            // Create headers
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }
            
            // Create data rows
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            
            int rowNum = 1;
            for (Employee employee : employees) {
                Row row = sheet.createRow(rowNum++);
                
                // Employee Number
                createCell(row, EMPLOYEE_NUMBER_IDX, employee.getEmployeeNumber());
                
                // Name
                createCell(row, NAME_IDX, employee.getName());
                
                // Email
                createCell(row, EMAIL_IDX, employee.getEmail());
                
                // Phone
                createCell(row, PHONE_IDX, employee.getPhone());
                
                // Department
                createCell(row, DEPARTMENT_IDX, employee.getDepartment() != null ? 
                        employee.getDepartment().getName() : "");
                
                // Position
                createCell(row, POSITION_IDX, employee.getPosition() != null ? 
                        employee.getPosition().getJobTitle() : "");
                
                // Hire Date
                Cell hireCell = row.createCell(HIRE_DATE_IDX);
                if (employee.getHireDate() != null) {
                    hireCell.setCellValue(employee.getHireDate().toString());
                    hireCell.setCellStyle(dateStyle);
                }
                
                // Status
                createCell(row, STATUS_IDX, employee.getStatus() != null ? 
                        employee.getStatus().getDisplayName() : "");
                
                // Gender
                createCell(row, GENDER_IDX, employee.getGender() != null ? 
                        employee.getGender().getDisplayName() : "");
                
                // Birth Date
                Cell birthCell = row.createCell(BIRTH_DATE_IDX);
                if (employee.getBirthDate() != null) {
                    birthCell.setCellValue(employee.getBirthDate().toString());
                    birthCell.setCellStyle(dateStyle);
                }
                
                // Address
                createCell(row, ADDRESS_IDX, employee.getAddress());
                
                // Salary
                Cell salaryCell = row.createCell(SALARY_IDX);
                if (employee.getSalary() != null) {
                    salaryCell.setCellValue(employee.getSalary().doubleValue());
                    salaryCell.setCellStyle(currencyStyle);
                }
                
                // Emergency Contact Name
                createCell(row, EMERGENCY_CONTACT_NAME_IDX, employee.getEmergencyContactName());
                
                // Emergency Contact Phone
                createCell(row, EMERGENCY_CONTACT_PHONE_IDX, employee.getEmergencyContactPhone());
                
                // Notes
                createCell(row, NOTES_IDX, employee.getNotes());
            }
            
            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            return out.toByteArray();
        }
    }
    
    @Override
    public Map<Integer, List<String>> validateEmployeeData(List<Employee> employees) {
        Map<Integer, List<String>> validationErrors = new HashMap<>();
        
        // Track duplicate employee numbers and emails for cross-validation
        Map<String, Integer> employeeNumbers = new HashMap<>();
        Map<String, Integer> emails = new HashMap<>();
        
        for (int i = 0; i < employees.size(); i++) {
            Employee employee = employees.get(i);
            List<String> errors = new ArrayList<>();
            int rowNum = i + 1; // Row numbers start from 1
            
            // Validate required fields
            if (!StringUtils.hasText(employee.getEmployeeNumber())) {
                errors.add("Employee number is required");
            } else {
                // Check for duplicate employee numbers within the import file
                if (employeeNumbers.containsKey(employee.getEmployeeNumber())) {
                    errors.add("Duplicate employee number: " + employee.getEmployeeNumber() + 
                            " (also in row " + employeeNumbers.get(employee.getEmployeeNumber()) + ")");
                } else {
                    employeeNumbers.put(employee.getEmployeeNumber(), rowNum);
                }
                
                // Validate employee number format
                if (!employee.getEmployeeNumber().matches("^[A-Za-z0-9-_]{1,20}$")) {
                    errors.add("Employee number format is invalid (use only letters, numbers, hyphens, and underscores)");
                }
            }
            
            // Validate name
            if (!StringUtils.hasText(employee.getName())) {
                errors.add("Name is required");
            } else if (employee.getName().length() < 2 || employee.getName().length() > 100) {
                errors.add("Name must be between 2 and 100 characters");
            }
            
            // Validate department
            if (employee.getDepartment() == null) {
                errors.add("Department is required");
            }
            
            // Validate email format if provided
            if (StringUtils.hasText(employee.getEmail())) {
                String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
                if (!employee.getEmail().matches(emailRegex)) {
                    errors.add("Invalid email format");
                } else {
                    // Check for duplicate emails within the import file
                    if (emails.containsKey(employee.getEmail())) {
                        errors.add("Duplicate email: " + employee.getEmail() + 
                                " (also in row " + emails.get(employee.getEmail()) + ")");
                    } else {
                        emails.put(employee.getEmail(), rowNum);
                    }
                }
            }
            
            // Validate phone format if provided
            if (StringUtils.hasText(employee.getPhone())) {
                String phoneRegex = "^[+]?[0-9\\s\\-()]{10,20}$";
                if (!employee.getPhone().matches(phoneRegex)) {
                    errors.add("Invalid phone format");
                }
            }
            
            // Validate hire date
            if (employee.getHireDate() != null && employee.getHireDate().isAfter(LocalDate.now())) {
                errors.add("Hire date cannot be in the future");
            }
            
            // Validate birth date
            if (employee.getBirthDate() != null) {
                if (employee.getBirthDate().isAfter(LocalDate.now())) {
                    errors.add("Birth date cannot be in the future");
                }
                
                // Check if employee is at least 16 years old
                if (employee.getBirthDate().isAfter(LocalDate.now().minusYears(16))) {
                    errors.add("Employee must be at least 16 years old");
                }
            }
            
            // Validate salary
            if (employee.getSalary() != null && employee.getSalary().compareTo(BigDecimal.ZERO) < 0) {
                errors.add("Salary cannot be negative");
            }
            
            // Validate emergency contact phone if provided
            if (StringUtils.hasText(employee.getEmergencyContactPhone())) {
                String phoneRegex = "^[+]?[0-9\\s\\-()]{10,20}$";
                if (!employee.getEmergencyContactPhone().matches(phoneRegex)) {
                    errors.add("Invalid emergency contact phone format");
                }
            }
            
            if (!errors.isEmpty()) {
                validationErrors.put(rowNum, errors);
            }
        }
        
        return validationErrors;
    }
    
    @Override
    public byte[] getEmployeeImportTemplate() throws IOException {
        log.info("Generating employee import template");
        
        try (Workbook workbook = new XSSFWorkbook(); 
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Employee Template");
            
            // Create header row with styles
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            
            // Create headers
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }
            
            // Add sample data row
            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(EMPLOYEE_NUMBER_IDX).setCellValue("EMP001");
            sampleRow.createCell(NAME_IDX).setCellValue("John Doe");
            sampleRow.createCell(EMAIL_IDX).setCellValue("john.doe@company.com");
            sampleRow.createCell(PHONE_IDX).setCellValue("+1-555-123-4567");
            sampleRow.createCell(DEPARTMENT_IDX).setCellValue("IT Department");
            sampleRow.createCell(POSITION_IDX).setCellValue("Software Developer");
            sampleRow.createCell(HIRE_DATE_IDX).setCellValue("2023-01-15");
            sampleRow.createCell(STATUS_IDX).setCellValue("Active");
            sampleRow.createCell(GENDER_IDX).setCellValue("Male");
            sampleRow.createCell(BIRTH_DATE_IDX).setCellValue("1990-05-20");
            sampleRow.createCell(ADDRESS_IDX).setCellValue("123 Main St, City, State");
            sampleRow.createCell(SALARY_IDX).setCellValue(75000.00);
            sampleRow.createCell(EMERGENCY_CONTACT_NAME_IDX).setCellValue("Jane Doe");
            sampleRow.createCell(EMERGENCY_CONTACT_PHONE_IDX).setCellValue("+1-555-987-6543");
            sampleRow.createCell(NOTES_IDX).setCellValue("Sample employee record");
            
            // Add data validation for dropdowns
            addDataValidation(sheet, workbook);
            
            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            return out.toByteArray();
        }
    }
    
    /**
     * Parse employee from Excel row
     */
    private Employee parseEmployeeFromRow(Row row) {
        Employee.EmployeeBuilder builder = Employee.builder();
        
        // Employee Number (required)
        String employeeNumber = getCellValueAsString(row.getCell(EMPLOYEE_NUMBER_IDX));
        if (!StringUtils.hasText(employeeNumber)) {
            throw new IllegalArgumentException("Employee number is required");
        }
        builder.employeeNumber(employeeNumber);
        
        // Name (required)
        String name = getCellValueAsString(row.getCell(NAME_IDX));
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Name is required");
        }
        builder.name(name);
        
        // Email
        String email = getCellValueAsString(row.getCell(EMAIL_IDX));
        if (StringUtils.hasText(email)) {
            builder.email(email);
        }
        
        // Phone
        String phone = getCellValueAsString(row.getCell(PHONE_IDX));
        if (StringUtils.hasText(phone)) {
            builder.phone(phone);
        }
        
        // Department (required)
        String departmentName = getCellValueAsString(row.getCell(DEPARTMENT_IDX));
        if (!StringUtils.hasText(departmentName)) {
            throw new IllegalArgumentException("Department is required");
        }
        Department department = departmentRepository.findByNameIgnoreCase(departmentName)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + departmentName));
        builder.department(department);
        
        // Position
        String positionTitle = getCellValueAsString(row.getCell(POSITION_IDX));
        if (StringUtils.hasText(positionTitle)) {
            Position position = positionRepository.findByJobTitleIgnoreCase(positionTitle)
                    .orElse(null);
            builder.position(position);
        }
        
        // Hire Date
        String hireDateStr = getCellValueAsString(row.getCell(HIRE_DATE_IDX));
        if (StringUtils.hasText(hireDateStr)) {
            try {
                LocalDate hireDate = LocalDate.parse(hireDateStr, DATE_FORMATTER);
                builder.hireDate(hireDate);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid hire date format. Use yyyy-MM-dd");
            }
        }
        
        // Status
        String statusStr = getCellValueAsString(row.getCell(STATUS_IDX));
        if (StringUtils.hasText(statusStr)) {
            try {
                EmployeeStatus status = parseEmployeeStatus(statusStr);
                builder.status(status);
            } catch (IllegalArgumentException e) {
                builder.status(EmployeeStatus.ACTIVE); // Default to ACTIVE
            }
        } else {
            builder.status(EmployeeStatus.ACTIVE);
        }
        
        // Gender
        String genderStr = getCellValueAsString(row.getCell(GENDER_IDX));
        if (StringUtils.hasText(genderStr)) {
            try {
                Gender gender = parseGender(genderStr);
                builder.gender(gender);
            } catch (IllegalArgumentException e) {
                // Ignore invalid gender, leave as null
            }
        }
        
        // Birth Date
        String birthDateStr = getCellValueAsString(row.getCell(BIRTH_DATE_IDX));
        if (StringUtils.hasText(birthDateStr)) {
            try {
                LocalDate birthDate = LocalDate.parse(birthDateStr, DATE_FORMATTER);
                builder.birthDate(birthDate);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid birth date format. Use yyyy-MM-dd");
            }
        }
        
        // Address
        String address = getCellValueAsString(row.getCell(ADDRESS_IDX));
        if (StringUtils.hasText(address)) {
            builder.address(address);
        }
        
        // Salary
        String salaryStr = getCellValueAsString(row.getCell(SALARY_IDX));
        if (StringUtils.hasText(salaryStr)) {
            try {
                BigDecimal salary = new BigDecimal(salaryStr);
                builder.salary(salary);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid salary format");
            }
        }
        
        // Emergency Contact Name
        String emergencyContactName = getCellValueAsString(row.getCell(EMERGENCY_CONTACT_NAME_IDX));
        if (StringUtils.hasText(emergencyContactName)) {
            builder.emergencyContactName(emergencyContactName);
        }
        
        // Emergency Contact Phone
        String emergencyContactPhone = getCellValueAsString(row.getCell(EMERGENCY_CONTACT_PHONE_IDX));
        if (StringUtils.hasText(emergencyContactPhone)) {
            builder.emergencyContactPhone(emergencyContactPhone);
        }
        
        // Notes
        String notes = getCellValueAsString(row.getCell(NOTES_IDX));
        if (StringUtils.hasText(notes)) {
            builder.notes(notes);
        }
        
        return builder.build();
    }    

    /**
     * Check if row is empty
     */
    private boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }
        
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK && 
                StringUtils.hasText(getCellValueAsString(cell))) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Get cell value as string
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }
    
    /**
     * Parse employee status from string
     */
    private EmployeeStatus parseEmployeeStatus(String statusStr) {
        for (EmployeeStatus status : EmployeeStatus.values()) {
            if (status.getDisplayName().equalsIgnoreCase(statusStr) || 
                status.name().equalsIgnoreCase(statusStr)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid employee status: " + statusStr);
    }
    
    /**
     * Parse gender from string
     */
    private Gender parseGender(String genderStr) {
        for (Gender gender : Gender.values()) {
            if (gender.getDisplayName().equalsIgnoreCase(genderStr) || 
                gender.name().equalsIgnoreCase(genderStr)) {
                return gender;
            }
        }
        throw new IllegalArgumentException("Invalid gender: " + genderStr);
    }
    
    /**
     * Create header cell style
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    /**
     * Create date cell style
     */
    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd"));
        return style;
    }
    
    /**
     * Create currency cell style
     */
    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("$#,##0.00"));
        return style;
    }
    
    /**
     * Create cell with string value
     */
    private void createCell(Row row, int columnIndex, String value) {
        Cell cell = row.createCell(columnIndex);
        if (value != null) {
            cell.setCellValue(value);
        }
    }
    
    /**
     * Add data validation for dropdown fields
     */
    private void addDataValidation(Sheet sheet, Workbook workbook) {
        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        
        // Status dropdown
        String[] statusValues = {"Active", "Inactive", "On Leave", "Terminated"};
        DataValidationConstraint statusConstraint = validationHelper.createExplicitListConstraint(statusValues);
        CellRangeAddressList statusRange = new CellRangeAddressList(1, 1000, STATUS_IDX, STATUS_IDX);
        DataValidation statusValidation = validationHelper.createValidation(statusConstraint, statusRange);
        statusValidation.setShowErrorBox(true);
        sheet.addValidationData(statusValidation);
        
        // Gender dropdown
        String[] genderValues = {"Male", "Female", "Other"};
        DataValidationConstraint genderConstraint = validationHelper.createExplicitListConstraint(genderValues);
        CellRangeAddressList genderRange = new CellRangeAddressList(1, 1000, GENDER_IDX, GENDER_IDX);
        DataValidation genderValidation = validationHelper.createValidation(genderConstraint, genderRange);
        genderValidation.setShowErrorBox(true);
        sheet.addValidationData(genderValidation);
    }
}