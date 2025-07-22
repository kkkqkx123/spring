package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Department;

/**
 * Repository interface for Department entity
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Find department by name (case-insensitive)
     * 
     * @param name the department name
     * @return Optional containing the department if found
     */
    Optional<Department> findByNameIgnoreCase(String name);

    /**
     * Find department by name (exact match)
     * 
     * @param name the department name
     * @return Optional containing the department if found
     */
    Optional<Department> findByName(String name);

    /**
     * Check if department exists by name
     * 
     * @param name the department name
     * @return true if department exists
     */
    boolean existsByName(String name);

    /**
     * Find departments by parent ID
     * 
     * @param parentId the parent department ID
     * @return list of child departments
     */
    List<Department> findByParentId(Long parentId);

    /**
     * Find departments with null parent ID (root departments)
     * 
     * @return list of root departments
     */
    List<Department> findByParentIdIsNull();

    /**
     * Check if department has children
     * 
     * @param id the department ID
     * @return true if department has children
     */
    boolean existsByParentId(Long id);

    /**
     * Find departments by name containing (case-insensitive)
     * 
     * @param name the name to search for
     * @return list of departments
     */
    List<Department> findByNameContainingIgnoreCase(String name);

    /**
     * Find departments by path containing
     * 
     * @param path the path to search for
     * @return list of departments
     */
    List<Department> findByDepPathContaining(String path);

    /**
     * Find departments by path starting with
     * 
     * @param path the path prefix to search for
     * @return list of departments
     */
    List<Department> findByDepPathStartingWith(String path);

    /**
     * Get department tree
     * 
     * @return list of top-level departments with children populated
     */
    @Query("SELECT d FROM Department d WHERE d.parentId IS NULL ORDER BY d.name")
    List<Department> findRootDepartments();

    /**
     * Get department with children
     * 
     * @param id the department ID
     * @return the department with children populated
     */
    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.children WHERE d.id = :id")
    Optional<Department> findWithChildren(@Param("id") Long id);

    /**
     * Count employees by department ID
     * 
     * @param departmentId the department ID
     * @return count of employees
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    long countEmployeesByDepartmentId(@Param("departmentId") Long departmentId);
}