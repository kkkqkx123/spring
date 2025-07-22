package com.example.demo.service;

import java.util.List;

import com.example.demo.model.dto.PositionDto;
import com.example.demo.model.entity.Position;

/**
 * Service interface for position management
 */
public interface PositionService {
    
    /**
     * Get all positions
     * 
     * @return a list of all positions
     */
    List<Position> getAllPositions();
    
    /**
     * Get a position by ID
     * 
     * @param id the position ID
     * @return the position
     * @throws jakarta.persistence.EntityNotFoundException if the position is not found
     */
    Position getPositionById(Long id);
    
    /**
     * Get a position by job title
     * 
     * @param jobTitle the job title
     * @return the position
     * @throws jakarta.persistence.EntityNotFoundException if the position is not found
     */
    Position getPositionByJobTitle(String jobTitle);
    
    /**
     * Create a new position
     * 
     * @param positionDto the position data
     * @return the created position
     * @throws IllegalArgumentException if the job title already exists
     */
    Position createPosition(PositionDto positionDto);
    
    /**
     * Update a position
     * 
     * @param id the position ID
     * @param positionDto the position data
     * @return the updated position
     * @throws jakarta.persistence.EntityNotFoundException if the position is not found
     * @throws IllegalArgumentException if the job title already exists
     */
    Position updatePosition(Long id, PositionDto positionDto);
    
    /**
     * Delete a position
     * 
     * @param id the position ID
     * @throws jakarta.persistence.EntityNotFoundException if the position is not found
     * @throws IllegalStateException if the position has employees
     */
    void deletePosition(Long id);
    
    /**
     * Get positions by department ID
     * 
     * @param departmentId the department ID
     * @return a list of positions in the department
     */
    List<Position> getPositionsByDepartmentId(Long departmentId);
    
    /**
     * Search positions by job title or professional title
     * 
     * @param searchTerm the search term
     * @return a list of positions matching the search criteria
     */
    List<Position> searchPositions(String searchTerm);
    
    /**
     * Check if a position has employees
     * 
     * @param id the position ID
     * @return true if the position has employees, false otherwise
     */
    boolean hasEmployees(Long id);
    
    /**
     * Convert a Position entity to a PositionDto
     * 
     * @param position the position entity
     * @return the position DTO
     */
    PositionDto convertToDto(Position position);
    
    /**
     * Convert a PositionDto to a Position entity
     * 
     * @param positionDto the position DTO
     * @return the position entity
     */
    Position convertToEntity(PositionDto positionDto);
}