package com.example.demo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.dto.PositionDto;
import com.example.demo.model.entity.Position;
import com.example.demo.service.PositionService;

import jakarta.validation.Valid;

/**
 * REST controller for position management
 */
@RestController
@RequestMapping("/api/positions")
public class PositionController {

    @Autowired
    private PositionService positionService;

    /**
     * Get all positions
     * 
     * @return a list of all positions
     */
    @GetMapping
    public ResponseEntity<List<PositionDto>> getAllPositions() {
        List<Position> positions = positionService.getAllPositions();
        List<PositionDto> positionDtos = positions.stream()
                .map(positionService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(positionDtos);
    }

    /**
     * Get a position by ID
     * 
     * @param id the position ID
     * @return the position
     */
    @GetMapping("/{id}")
    public ResponseEntity<PositionDto> getPositionById(@PathVariable Long id) {
        Position position = positionService.getPositionById(id);
        return ResponseEntity.ok(positionService.convertToDto(position));
    }

    /**
     * Create a new position
     * 
     * @param positionDto the position data
     * @return the created position
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR_MANAGER')")
    public ResponseEntity<PositionDto> createPosition(@Valid @RequestBody PositionDto positionDto) {
        Position position = positionService.createPosition(positionDto);
        return new ResponseEntity<>(positionService.convertToDto(position), HttpStatus.CREATED);
    }

    /**
     * Update a position
     * 
     * @param id the position ID
     * @param positionDto the position data
     * @return the updated position
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR_MANAGER')")
    public ResponseEntity<PositionDto> updatePosition(@PathVariable Long id, @Valid @RequestBody PositionDto positionDto) {
        Position position = positionService.updatePosition(id, positionDto);
        return ResponseEntity.ok(positionService.convertToDto(position));
    }

    /**
     * Delete a position
     * 
     * @param id the position ID
     * @return no content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get positions by department ID
     * 
     * @param departmentId the department ID
     * @return a list of positions in the department
     */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<PositionDto>> getPositionsByDepartmentId(@PathVariable Long departmentId) {
        List<Position> positions = positionService.getPositionsByDepartmentId(departmentId);
        List<PositionDto> positionDtos = positions.stream()
                .map(positionService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(positionDtos);
    }

    /**
     * Search positions by job title or professional title
     * 
     * @param searchTerm the search term
     * @return a list of positions matching the search criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<PositionDto>> searchPositions(@RequestParam(required = false) String searchTerm) {
        List<Position> positions = positionService.searchPositions(searchTerm);
        List<PositionDto> positionDtos = positions.stream()
                .map(positionService::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(positionDtos);
    }

    /**
     * Check if a position has employees
     * 
     * @param id the position ID
     * @return true if the position has employees, false otherwise
     */
    @GetMapping("/{id}/has-employees")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR_MANAGER')")
    public ResponseEntity<Boolean> hasEmployees(@PathVariable Long id) {
        boolean hasEmployees = positionService.hasEmployees(id);
        return ResponseEntity.ok(hasEmployees);
    }
}