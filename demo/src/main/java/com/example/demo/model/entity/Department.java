package com.example.demo.model.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Department entity with hierarchical structure support
 */
@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Department extends BaseEntity {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Department name is required")
    @Size(min = 2, max = 100, message = "Department name must be between 2 and 100 characters")
    @Column(unique = true)
    private String name;
    
    /**
     * Department description
     */
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(length = 500)
    private String description;
    
    /**
     * Path for efficient hierarchical queries
     * Format: /1/2/3/ where numbers are department IDs
     */
    @Column(name = "dep_path")
    private String depPath;
    
    /**
     * Parent department ID
     */
    @Column(name = "parent_id")
    private Long parentId;
    
    /**
     * Flag indicating if this department has child departments
     */
    @Column(name = "is_parent")
    private Boolean isParent = false;
    
    /**
     * Parent department reference
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private Department parent;
    
    /**
     * Child departments
     */
    @OneToMany(mappedBy = "parent", cascade = {CascadeType.REMOVE, CascadeType.PERSIST}, fetch = FetchType.LAZY)
    private List<Department> children = new ArrayList<>();

    @OneToMany(mappedBy = "department", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Employee> employees = new ArrayList<>();
    
    /**
     * Update depPath before persist or update
     */
    @PrePersist
    @PreUpdate
    public void updateDepPath() {
        if (parentId == null) {
            // Root department
            depPath = "/" + id + "/";
        } else {
            // Child department - path will be updated after save
            if (parent != null && parent.getDepPath() != null) {
                depPath = parent.getDepPath() + id + "/";
            } else if (depPath == null) {
                // If parent is not loaded but parentId is set, use a placeholder
                // This will be updated properly when the entity is fully loaded
                depPath = "/" + parentId + "/" + id + "/";
            }
        }
    }
    
    /**
     * Add a child department
     * 
     * @param child the child department to add
     */
    public void addChild(Department child) {
        children.add(child);
        child.setParent(this);
        child.setParentId(this.id);
        this.isParent = true;
    }
    
    /**
     * Remove a child department
     * 
     * @param child the child department to remove
     */
    public void removeChild(Department child) {
        children.remove(child);
        child.setParent(null);
        child.setParentId(null);
        this.isParent = !children.isEmpty();
    }
    
    /**
     * Get the department level in the hierarchy
     * 
     * @return the level (0 for root, 1 for first level, etc.)
     */
    public int getLevel() {
        if (depPath == null) {
            return 0;
        }
        // Count slashes and subtract 1 (root has 2 slashes: /id/)
        return depPath.split("/").length - 1;
    }

    /**
     * Set the department description
     * 
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }
}