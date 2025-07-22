package com.example.demo.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.dto.PositionDto;
import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Position;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.PositionRepository;
import com.example.demo.service.PositionService;

import jakarta.persistence.EntityNotFoundException;

/**
 * Implementation of PositionService
 */
@Service
public class PositionServiceImpl implements PositionService {

    @Autowired
    private PositionRepository positionRepository;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Override
    public List<Position> getAllPositions() {
        return positionRepository.findAll();
    }
    
    @Override
    public Position getPositionById(Long id) {
        return positionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Position not found with ID: " + id));
    }
    
    @Override
    public Position getPositionByJobTitle(String jobTitle) {
        return positionRepository.findByJobTitle(jobTitle)
                .orElseThrow(() -> new EntityNotFoundException("Position not found with job title: " + jobTitle));
    }
    
    @Override
    @Transactional
    public Position createPosition(PositionDto positionDto) {
        // Check if job title already exists
        if (positionRepository.existsByJobTitle(positionDto.getJobTitle())) {
            throw new IllegalArgumentException("Position with job title '" + positionDto.getJobTitle() + "' already exists");
        }
        
        // Validate salary range if provided
        if (positionDto.getSalaryMin() != null && positionDto.getSalaryMax() != null 
                && positionDto.getSalaryMin() > positionDto.getSalaryMax()) {
            throw new IllegalArgumentException("Minimum salary cannot be greater than maximum salary");
        }
        
        Position position = convertToEntity(positionDto);
        return positionRepository.save(position);
    }
    
    @Override
    @Transactional
    public Position updatePosition(Long id, PositionDto positionDto) {
        // Check if position exists
        Position existingPosition = getPositionById(id);
        
        // Check if job title already exists for another position
        if (!existingPosition.getJobTitle().equals(positionDto.getJobTitle()) 
                && positionRepository.existsByJobTitleAndIdNot(positionDto.getJobTitle(), id)) {
            throw new IllegalArgumentException("Position with job title '" + positionDto.getJobTitle() + "' already exists");
        }
        
        // Validate salary range if provided
        if (positionDto.getSalaryMin() != null && positionDto.getSalaryMax() != null 
                && positionDto.getSalaryMin() > positionDto.getSalaryMax()) {
            throw new IllegalArgumentException("Minimum salary cannot be greater than maximum salary");
        }
        
        // Update position fields
        existingPosition.setJobTitle(positionDto.getJobTitle());
        existingPosition.setProfessionalTitle(positionDto.getProfessionalTitle());
        existingPosition.setDescription(positionDto.getDescription());
        existingPosition.setSalaryMin(positionDto.getSalaryMin());
        existingPosition.setSalaryMax(positionDto.getSalaryMax());
        existingPosition.setIsActive(positionDto.getIsActive());
        
        // Update department if changed
        if (!existingPosition.getDepartment().getId().equals(positionDto.getDepartmentId())) {
            Department department = departmentRepository.findById(positionDto.getDepartmentId())
                    .orElseThrow(() -> new EntityNotFoundException("Department not found with ID: " + positionDto.getDepartmentId()));
            existingPosition.setDepartment(department);
        }
        
        return positionRepository.save(existingPosition);
    }
    
    @Override
    @Transactional
    public void deletePosition(Long id) {
        // Check if position exists
        Position position = getPositionById(id);
        
        // Check if position has employees
        if (hasEmployees(id)) {
            throw new IllegalStateException("Cannot delete position with ID " + id + " because it has assigned employees");
        }
        
        positionRepository.delete(position);
    }
    
    @Override
    public List<Position> getPositionsByDepartmentId(Long departmentId) {
        // Check if department exists
        if (!departmentRepository.existsById(departmentId)) {
            throw new EntityNotFoundException("Department not found with ID: " + departmentId);
        }
        
        return positionRepository.findByDepartmentId(departmentId);
    }
    
    @Override
    public List<Position> searchPositions(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllPositions();
        }
        return positionRepository.searchByTitleContaining(searchTerm.trim());
    }
    
    @Override
    public boolean hasEmployees(Long id) {
        return positionRepository.countEmployeesByPositionId(id) > 0;
    }
    
    @Override
    public PositionDto convertToDto(Position position) {
        PositionDto dto = new PositionDto();
        dto.setId(position.getId());
        dto.setJobTitle(position.getJobTitle());
        dto.setProfessionalTitle(position.getProfessionalTitle());
        dto.setDescription(position.getDescription());
        dto.setDepartmentId(position.getDepartment().getId());
        dto.setDepartmentName(position.getDepartment().getName());
        dto.setSalaryMin(position.getSalaryMin());
        dto.setSalaryMax(position.getSalaryMax());
        dto.setIsActive(position.getIsActive());
        dto.setEmployeeCount((int) positionRepository.countEmployeesByPositionId(position.getId()));
        return dto;
    }
    
    @Override
    public Position convertToEntity(PositionDto positionDto) {
        Position position = new Position();
        position.setId(positionDto.getId());
        position.setJobTitle(positionDto.getJobTitle());
        position.setProfessionalTitle(positionDto.getProfessionalTitle());
        position.setDescription(positionDto.getDescription());
        position.setSalaryMin(positionDto.getSalaryMin());
        position.setSalaryMax(positionDto.getSalaryMax());
        position.setIsActive(positionDto.getIsActive());
        
        // Set department
        Department department = departmentRepository.findById(positionDto.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found with ID: " + positionDto.getDepartmentId()));
        position.setDepartment(department);
        
        return position;
    }
}