package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Position;

/**
 * Repository for Position entity with CRUD and search capabilities
 */
@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    
    /**
     * Find a position by job title
     * 
     * @param jobTitle the job title
     * @return an Optional containing the position if found
     */
    Optional<Position> findByJobTitle(String jobTitle);
    
    /**
     * Find positions by job title containing the given text (case insensitive)
     * 
     * @param jobTitle the job title text to search for
     * @return a list of positions matching the search criteria
     */
    List<Position> findByJobTitleContainingIgnoreCase(String jobTitle);
    
    /**
     * Find positions by professional title containing the given text (case insensitive)
     * 
     * @param professionalTitle the professional title text to search for
     * @return a list of positions matching the search criteria
     */
    List<Position> findByProfessionalTitleContainingIgnoreCase(String professionalTitle);
    
    /**
     * Find positions by department ID
     * 
     * @param departmentId the department ID
     * @return a list of positions in the department
     */
    List<Position> findByDepartmentId(Long departmentId);
    
    /**
     * Check if a position with the given job title exists
     * 
     * @param jobTitle the job title
     * @return true if the position exists, false otherwise
     */
    boolean existsByJobTitle(String jobTitle);
    
    /**
     * Check if a position with the given job title exists and has a different ID
     * 
     * @param jobTitle the job title
     * @param id the position ID to exclude
     * @return true if another position with the same job title exists, false otherwise
     */
    boolean existsByJobTitleAndIdNot(String jobTitle, Long id);
    
    /**
     * Search positions by job title or professional title containing the given text (case insensitive)
     * 
     * @param searchTerm the search term
     * @return a list of positions matching the search criteria
     */
    @Query("SELECT p FROM Position p WHERE LOWER(p.jobTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.professionalTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Position> searchByTitleContaining(@Param("searchTerm") String searchTerm);
    
    /**
     * Count the number of employees assigned to a position
     * 
     * @param positionId the position ID
     * @return the number of employees with the position
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.position.id = :positionId")
    long countEmployeesByPositionId(@Param("positionId") Long positionId);
}