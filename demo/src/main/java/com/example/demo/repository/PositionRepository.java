package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Position;

/**
 * Repository interface for Position entity
 */
@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    
    /**
     * Find position by job title (exact match)
     * 
     * @param jobTitle the job title
     * @return Optional containing the position if found
     */
    Optional<Position> findByJobTitle(String jobTitle);
    
    /**
     * Find position by job title (case-insensitive)
     * 
     * @param jobTitle the job title
     * @return Optional containing the position if found
     */
    Optional<Position> findByJobTitleIgnoreCase(String jobTitle);
    
    /**
     * Check if position exists by job title
     * 
     * @param jobTitle the job title
     * @return true if position exists
     */
    boolean existsByJobTitle(String jobTitle);
    
    /**
     * Check if position exists by job title and ID not equal to
     * 
     * @param jobTitle the job title
     * @param id the position ID to exclude
     * @return true if position exists
     */
    boolean existsByJobTitleAndIdNot(String jobTitle, Long id);
    
    /**
     * Find positions by job title containing (case-insensitive)
     * 
     * @param jobTitle the job title to search for
     * @return list of positions
     */
    List<Position> findByJobTitleContainingIgnoreCase(String jobTitle);
    
    /**
     * Find positions by professional title containing (case-insensitive)
     * 
     * @param professionalTitle the professional title to search for
     * @return list of positions
     */
    List<Position> findByProfessionalTitleContainingIgnoreCase(String professionalTitle);
    
    /**
     * Find positions by department ID
     * 
     * @param departmentId the department ID
     * @return list of positions
     */
    List<Position> findByDepartmentId(Long departmentId);
    
    /**
     * Count positions by department ID
     * 
     * @param departmentId the department ID
     * @return count of positions
     */
    long countByDepartmentId(Long departmentId);
    
    /**
     * Count employees by position ID
     * 
     * @param positionId the position ID
     * @return count of employees
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.position.id = :positionId")
    long countEmployeesByPositionId(@Param("positionId") Long positionId);
    
    /**
     * Search positions by title containing
     * 
     * @param searchTerm the search term
     * @return list of positions
     */
    @Query("SELECT p FROM Position p WHERE LOWER(p.jobTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.professionalTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Position> searchByTitleContaining(@Param("searchTerm") String searchTerm);
}