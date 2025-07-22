package com.example.demo.model.entity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for Department entity
 */
class DepartmentTest {
    
    private Department parent;
    private Department child1;
    private Department child2;
    
    @BeforeEach
    void setUp() {
        // Create parent department
        parent = new Department();
        parent.setId(1L);
        parent.setName("IT Department");
        parent.setDepPath("/1/");
        parent.setIsParent(false);
        
        // Create child departments
        child1 = new Department();
        child1.setId(2L);
        child1.setName("Software Development");
        
        child2 = new Department();
        child2.setId(3L);
        child2.setName("IT Support");
    }
    
    @Test
    void testAddChild_SetsParentChildRelationship() {
        // Add child to parent
        parent.addChild(child1);
        
        // Verify parent-child relationship
        assertTrue(parent.getChildren().contains(child1));
        assertEquals(parent, child1.getParent());
        assertEquals(parent.getId(), child1.getParentId());
        assertTrue(parent.getIsParent());
    }
    
    @Test
    void testRemoveChild_RemovesParentChildRelationship() {
        // Add child to parent
        parent.addChild(child1);
        
        // Remove child from parent
        parent.removeChild(child1);
        
        // Verify parent-child relationship is removed
        assertFalse(parent.getChildren().contains(child1));
        assertNull(child1.getParent());
        assertNull(child1.getParentId());
        assertFalse(parent.getIsParent());
    }
    
    @Test
    void testRemoveChild_KeepsIsParentTrueWhenOtherChildrenExist() {
        // Add children to parent
        parent.addChild(child1);
        parent.addChild(child2);
        
        // Remove one child
        parent.removeChild(child1);
        
        // Verify parent still has isParent=true
        assertTrue(parent.getIsParent());
        assertEquals(1, parent.getChildren().size());
        assertTrue(parent.getChildren().contains(child2));
    }
    
    @Test
    void testGetLevel_ReturnsCorrectLevel() {
        // Root department
        parent.setDepPath("/1/");
        assertEquals(1, parent.getLevel());
        
        // First level department
        child1.setDepPath("/1/2/");
        assertEquals(2, child1.getLevel());
        
        // Second level department
        Department grandchild = new Department();
        grandchild.setDepPath("/1/2/4/");
        assertEquals(3, grandchild.getLevel());
        
        // Null depPath
        Department nullDep = new Department();
        assertEquals(0, nullDep.getLevel());
    }
    
    @Test
    void testUpdateDepPath_SetsCorrectPathForRootDepartment() {
        // Create a new department without a parent
        Department root = new Department();
        root.setId(5L);
        root.setName("HR Department");
        
        // Call updateDepPath
        root.updateDepPath();
        
        // Verify depPath
        assertEquals("/5/", root.getDepPath());
    }
    
    @Test
    void testUpdateDepPath_SetsCorrectPathForChildDepartment() {
        // Create a child department with a parent
        Department child = new Department();
        child.setId(6L);
        child.setName("Recruitment");
        
        // Set parent with depPath
        Department parent = new Department();
        parent.setId(5L);
        parent.setDepPath("/5/");
        
        child.setParent(parent);
        child.setParentId(parent.getId());
        
        // Call updateDepPath
        child.updateDepPath();
        
        // Verify depPath
        assertEquals("/5/6/", child.getDepPath());
    }
}