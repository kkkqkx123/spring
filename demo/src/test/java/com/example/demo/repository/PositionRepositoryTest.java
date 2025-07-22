package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.example.demo.model.entity.Department;
import com.example.demo.model.entity.Employee;
import com.example.demo.model.entity.Position;

/**
 * Integration tests for PositionRepository
 */
@DataJpaTest
@ActiveProfiles("test")
class PositionRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private PositionRepository positionRepository;
    
    private Department department;
    
    @BeforeEach
    void setUp() {
        // Create and persist a department for testing
        department = new Department();
        department.setName("IT Department");
        entityManager.persist(department);
        entityManager.flush();
    }
    
    @Test
    void testFindByJobTitle_WhenPositionExists_ReturnsPosition() {
        // Create and persist a position
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setProfessionalTitle("Senior Developer");
        position.setDescription("Develops software applications");
        position.setDepartment(department);
        entityManager.persist(position);
        entityManager.flush();
        
        // Find by job title
        Optional<Position> found = positionRepository.findByJobTitle("Software Engineer");
        
        // Verify
        assertTrue(found.isPresent());
        assertEquals("Software Engineer", found.get().getJobTitle());
        assertEquals("Senior Developer", found.get().getProfessionalTitle());
    }
    
    @Test
    void testFindByJobTitle_WhenPositionDoesNotExist_ReturnsEmpty() {
        // Find by non-existent job title
        Optional<Position> found = positionRepository.findByJobTitle("Non-existent Position");
        
        // Verify
        assertFalse(found.isPresent());
    }
    
    @Test
    void testFindByJobTitleContainingIgnoreCase_ReturnsMatchingPositions() {
        // Create and persist positions
        Position position1 = new Position();
        position1.setJobTitle("Software Engineer");
        position1.setProfessionalTitle("Senior Developer");
        position1.setDepartment(department);
        entityManager.persist(position1);
        
        Position position2 = new Position();
        position2.setJobTitle("Senior Software Engineer");
        position2.setProfessionalTitle("Lead Developer");
        position2.setDepartment(department);
        entityManager.persist(position2);
        
        Position position3 = new Position();
        position3.setJobTitle("Project Manager");
        position3.setProfessionalTitle("Technical Manager");
        position3.setDepartment(department);
        entityManager.persist(position3);
        
        entityManager.flush();
        
        // Find positions containing "software" (case insensitive)
        List<Position> found = positionRepository.findByJobTitleContainingIgnoreCase("software");
        
        // Verify
        assertEquals(2, found.size());
        assertTrue(found.stream().anyMatch(p -> p.getJobTitle().equals("Software Engineer")));
        assertTrue(found.stream().anyMatch(p -> p.getJobTitle().equals("Senior Software Engineer")));
    }
    
    @Test
    void testFindByProfessionalTitleContainingIgnoreCase_ReturnsMatchingPositions() {
        // Create and persist positions
        Position position1 = new Position();
        position1.setJobTitle("Software Engineer");
        position1.setProfessionalTitle("Senior Developer");
        position1.setDepartment(department);
        entityManager.persist(position1);
        
        Position position2 = new Position();
        position2.setJobTitle("Project Manager");
        position2.setProfessionalTitle("Technical Manager");
        position2.setDepartment(department);
        entityManager.persist(position2);
        
        Position position3 = new Position();
        position3.setJobTitle("QA Engineer");
        position3.setProfessionalTitle("Quality Assurance Developer");
        position3.setDepartment(department);
        entityManager.persist(position3);
        
        entityManager.flush();
        
        // Find positions with professional title containing "developer" (case insensitive)
        List<Position> found = positionRepository.findByProfessionalTitleContainingIgnoreCase("developer");
        
        // Verify
        assertEquals(2, found.size());
        assertTrue(found.stream().anyMatch(p -> p.getProfessionalTitle().equals("Senior Developer")));
        assertTrue(found.stream().anyMatch(p -> p.getProfessionalTitle().equals("Quality Assurance Developer")));
    }
    
    @Test
    void testFindByDepartmentId_ReturnsPositionsInDepartment() {
        // Create another department
        Department hrDepartment = new Department();
        hrDepartment.setName("HR Department");
        entityManager.persist(hrDepartment);
        
        // Create and persist positions in different departments
        Position position1 = new Position();
        position1.setJobTitle("Software Engineer");
        position1.setDepartment(department); // IT Department
        entityManager.persist(position1);
        
        Position position2 = new Position();
        position2.setJobTitle("HR Manager");
        position2.setDepartment(hrDepartment); // HR Department
        entityManager.persist(position2);
        
        Position position3 = new Position();
        position3.setJobTitle("IT Support");
        position3.setDepartment(department); // IT Department
        entityManager.persist(position3);
        
        entityManager.flush();
        
        // Find positions in IT Department
        List<Position> itPositions = positionRepository.findByDepartmentId(department.getId());
        
        // Verify
        assertEquals(2, itPositions.size());
        assertTrue(itPositions.stream().anyMatch(p -> p.getJobTitle().equals("Software Engineer")));
        assertTrue(itPositions.stream().anyMatch(p -> p.getJobTitle().equals("IT Support")));
        
        // Find positions in HR Department
        List<Position> hrPositions = positionRepository.findByDepartmentId(hrDepartment.getId());
        
        // Verify
        assertEquals(1, hrPositions.size());
        assertEquals("HR Manager", hrPositions.get(0).getJobTitle());
    }
    
    @Test
    void testExistsByJobTitle_WhenPositionExists_ReturnsTrue() {
        // Create and persist a position
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setDepartment(department);
        entityManager.persist(position);
        entityManager.flush();
        
        // Check if job title exists
        boolean exists = positionRepository.existsByJobTitle("Software Engineer");
        
        // Verify
        assertTrue(exists);
    }
    
    @Test
    void testExistsByJobTitle_WhenPositionDoesNotExist_ReturnsFalse() {
        // Check if non-existent job title exists
        boolean exists = positionRepository.existsByJobTitle("Non-existent Position");
        
        // Verify
        assertFalse(exists);
    }
    
    @Test
    void testExistsByJobTitleAndIdNot_WhenDuplicateExists_ReturnsTrue() {
        // Create and persist positions
        Position position1 = new Position();
        position1.setJobTitle("Software Engineer");
        position1.setDepartment(department);
        entityManager.persist(position1);
        
        Position position2 = new Position();
        position2.setJobTitle("Project Manager");
        position2.setDepartment(department);
        entityManager.persist(position2);
        
        entityManager.flush();
        
        // Check if another position with the same job title exists
        boolean exists = positionRepository.existsByJobTitleAndIdNot("Software Engineer", position2.getId());
        
        // Verify
        assertTrue(exists);
    }
    
    @Test
    void testExistsByJobTitleAndIdNot_WhenNoDuplicateExists_ReturnsFalse() {
        // Create and persist a position
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setDepartment(department);
        entityManager.persist(position);
        entityManager.flush();
        
        // Check if another position with the same job title exists
        boolean exists = positionRepository.existsByJobTitleAndIdNot("Project Manager", position.getId());
        
        // Verify
        assertFalse(exists);
    }
    
    @Test
    void testSearchByTitleContaining_ReturnsMatchingPositions() {
        // Create and persist positions
        Position position1 = new Position();
        position1.setJobTitle("Software Engineer");
        position1.setProfessionalTitle("Senior Developer");
        position1.setDepartment(department);
        entityManager.persist(position1);
        
        Position position2 = new Position();
        position2.setJobTitle("Project Manager");
        position2.setProfessionalTitle("Technical Lead");
        position2.setDepartment(department);
        entityManager.persist(position2);
        
        Position position3 = new Position();
        position3.setJobTitle("QA Engineer");
        position3.setProfessionalTitle("Quality Engineer");
        position3.setDepartment(department);
        entityManager.persist(position3);
        
        entityManager.flush();
        
        // Search for positions with "engineer" in job title or professional title
        List<Position> found = positionRepository.searchByTitleContaining("engineer");
        
        // Verify
        assertEquals(2, found.size());
        assertTrue(found.stream().anyMatch(p -> p.getJobTitle().equals("Software Engineer")));
        assertTrue(found.stream().anyMatch(p -> p.getJobTitle().equals("QA Engineer")));
    }
    
    @Test
    void testCountEmployeesByPositionId_ReturnsCorrectCount() {
        // Create and persist a position
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setDepartment(department);
        entityManager.persist(position);
        
        // Create and persist employees with the position
        Employee employee1 = new Employee();
        employee1.setName("John Doe");
        employee1.setPosition(position);
        entityManager.persist(employee1);
        
        Employee employee2 = new Employee();
        employee2.setName("Jane Smith");
        employee2.setPosition(position);
        entityManager.persist(employee2);
        
        entityManager.flush();
        
        // Count employees with the position
        long count = positionRepository.countEmployeesByPositionId(position.getId());
        
        // Verify
        assertEquals(2, count);
    }
    
    @Test
    void testCountEmployeesByPositionId_WhenNoEmployees_ReturnsZero() {
        // Create and persist a position
        Position position = new Position();
        position.setJobTitle("Software Engineer");
        position.setDepartment(department);
        entityManager.persist(position);
        entityManager.flush();
        
        // Count employees with the position
        long count = positionRepository.countEmployeesByPositionId(position.getId());
        
        // Verify
        assertEquals(0, count);
    }
}