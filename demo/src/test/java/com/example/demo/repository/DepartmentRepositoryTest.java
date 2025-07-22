package com.example.demo.repository;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.example.demo.model.entity.Department;

/**
 * Integration tests for DepartmentRepository
 */
@DataJpaTest
@ActiveProfiles("test")
class DepartmentRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Test
    void testFindByName_WhenDepartmentExists_ReturnsDepartment() {
        // Create and persist a department
        Department department = new Department();
        department.setName("IT Department");
        entityManager.persist(department);
        entityManager.flush();
        
        // Find by name
        Optional<Department> found = departmentRepository.findByName("IT Department");
        
        // Verify
        assertTrue(found.isPresent());
        assertEquals("IT Department", found.get().getName());
    }
    
    @Test
    void testFindByName_WhenDepartmentDoesNotExist_ReturnsEmpty() {
        // Find by non-existent name
        Optional<Department> found = departmentRepository.findByName("Non-existent Department");
        
        // Verify
        assertFalse(found.isPresent());
    }
    
    @Test
    void testExistsByName_WhenDepartmentExists_ReturnsTrue() {
        // Create and persist a department
        Department department = new Department();
        department.setName("IT Department");
        entityManager.persist(department);
        entityManager.flush();
        
        // Check if name exists
        boolean exists = departmentRepository.existsByName("IT Department");
        
        // Verify
        assertTrue(exists);
    }
    
    @Test
    void testExistsByName_WhenDepartmentDoesNotExist_ReturnsFalse() {
        // Check if non-existent name exists
        boolean exists = departmentRepository.existsByName("Non-existent Department");
        
        // Verify
        assertFalse(exists);
    }
    
    @Test
    void testFindByParentIdIsNull_ReturnsRootDepartments() {
        // Create and persist root departments
        Department root1 = new Department();
        root1.setName("IT Department");
        entityManager.persist(root1);
        
        Department root2 = new Department();
        root2.setName("HR Department");
        entityManager.persist(root2);
        
        // Create and persist a child department
        Department child = new Department();
        child.setName("Software Development");
        child.setParentId(root1.getId());
        entityManager.persist(child);
        
        entityManager.flush();
        
        // Find root departments
        List<Department> roots = departmentRepository.findByParentIdIsNull();
        
        // Verify
        assertEquals(2, roots.size());
        assertTrue(roots.stream().anyMatch(d -> d.getName().equals("IT Department")));
        assertTrue(roots.stream().anyMatch(d -> d.getName().equals("HR Department")));
    }
    
    @Test
    void testFindByParentId_ReturnsChildDepartments() {
        // Create and persist a root department
        Department root = new Department();
        root.setName("IT Department");
        entityManager.persist(root);
        
        // Create and persist child departments
        Department child1 = new Department();
        child1.setName("Software Development");
        child1.setParentId(root.getId());
        entityManager.persist(child1);
        
        Department child2 = new Department();
        child2.setName("IT Support");
        child2.setParentId(root.getId());
        entityManager.persist(child2);
        
        entityManager.flush();
        
        // Find child departments
        List<Department> children = departmentRepository.findByParentId(root.getId());
        
        // Verify
        assertEquals(2, children.size());
        assertTrue(children.stream().anyMatch(d -> d.getName().equals("Software Development")));
        assertTrue(children.stream().anyMatch(d -> d.getName().equals("IT Support")));
    }
    
    @Test
    void testFindByDepPathStartingWith_ReturnsDepartmentsInPath() {
        // Create and persist departments with paths
        Department root = new Department();
        root.setName("IT Department");
        root.setDepPath("/1/");
        entityManager.persist(root);
        
        Department child1 = new Department();
        child1.setName("Software Development");
        child1.setDepPath("/1/2/");
        child1.setParentId(root.getId());
        entityManager.persist(child1);
        
        Department child2 = new Department();
        child2.setName("IT Support");
        child2.setDepPath("/1/3/");
        child2.setParentId(root.getId());
        entityManager.persist(child2);
        
        Department grandchild = new Department();
        grandchild.setName("Web Development");
        grandchild.setDepPath("/1/2/4/");
        grandchild.setParentId(child1.getId());
        entityManager.persist(grandchild);
        
        entityManager.flush();
        
        // Find departments in path
        List<Department> departments = departmentRepository.findByDepPathStartingWith("/1/2");
        
        // Verify
        assertEquals(2, departments.size());
        assertTrue(departments.stream().anyMatch(d -> d.getName().equals("Software Development")));
        assertTrue(departments.stream().anyMatch(d -> d.getName().equals("Web Development")));
    }
}