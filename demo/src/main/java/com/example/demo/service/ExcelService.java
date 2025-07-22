package com.example.demo.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.entity.Employee;

/**
 * Service interface for Excel import/export operations
 */
public interface ExcelService {
    
    /**
     * Import employees from Excel file
     * 
     * @param file the Excel file to import
     * @return list of imported employees
     * @throws IOException if file reading fails
     */
    List<Employee> importEmployeesFromExcel(MultipartFile file) throws IOException;
    
    /**
     * Export employees to Excel file
     * 
     * @param employees the list of employees to export
     * @return byte array containing the Excel file
     * @throws IOException if file writing fails
     */
    byte[] exportEmployeesToExcel(List<Employee> employees) throws IOException;
    
    /**
     * Validate employee data during import
     * 
     * @param employees the list of employees to validate
     * @return map of validation errors (row index -> error message)
     */
    Map<Integer, List<String>> validateEmployeeData(List<Employee> employees);
    
    /**
     * Get Excel template for employee import
     * 
     * @return byte array containing the template Excel file
     * @throws IOException if file creation fails
     */
    byte[] getEmployeeImportTemplate() throws IOException;
}