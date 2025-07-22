package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.entity.Department;

/**
 * Repository for Department entity with support for hierarchical queries
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    /**
     * Find a department by name
     * 
     * @param name the department name
     * @return an Optional containing the department if found
     */
    Optional<Department> findByName(String name);
    
    /**
     * Check if a department name exists
     * 
     * @param name the department name
     * @return true if the department name exists, false otherwise
     */
    boolean existsByName(String name);
    
    /**
     * Find all root departments (departments without a parent)
     * 
     * @return a list of root departments
     */
    List<Department> findByParentIdIsNull();
    
    /**
     * Find all child departments of a parent department
     * 
     * @param parentId the parent department ID
     * @return a list of child departments
     */
    List<Department> findByParentId(Long parentId);
    
    /**
     * Find all departments in a specific path
     * 
     * @param depPath the department path
     * @return a list of departments in the path
     */
    @Query("SELECT d FROM Department d WHERE d.depPath LIKE :depPath%")
    List<Department> findByDepPathStartingWith(@Param("depPath") String depPath);
    
    /**
     * Find all departments with a specific level in the hierarchy
     * 
     * @param level the level (0 for root, 1 for first level, etc.)
     * @return a list of departments at the specified level
     */
    @Query("SELECT d FROM Department d WHERE (LENGTH(d.depPath) - LENGTH(REPLACE(d.depPath, '/', ''))) / LENGTH('/') = :level + 1")
    List<Department> findByLevel(@Param("level") int level);
    
    /**
     * Get the department tree starting from a specific department
     * 
     * @param departmentId the department ID
     * @return a list of departments in the tree
     */
    @Query(value = "WITH RECURSIVE dept_tree AS (" +
                   "  SELECT * FROM departments WHERE id = :departmentId " +
                   "  UNION ALL " +
                   "  SELECT d.* FROM departments d " +
                   "  JOIN dept_tree dt ON d.parent_id = dt.id" +
                   ") " +
                   "SELECT * FROM dept_tree", nativeQuery = true)
    List<Department> getDepartmentTree(@Param("departmentId") Long departmentId);
    
    /**
     * Get all departments with their direct children eagerly loaded
     * 
     * @return a list of departments with children
     */
    @Query("SELECT DISTINCT d FROM Department d LEFT JOIN FETCH d.children")
    List<Department> findAllWithChildren();
    
    /**
     * Count the number of employees in a department
     * 
     * @param departmentId the department ID
     * @return the number of employees
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    long countEmployeesByDepartmentId(@Param("departmentId") Long departmentId);
}