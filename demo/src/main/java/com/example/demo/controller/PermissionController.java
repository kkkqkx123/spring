package com.example.demo.controller;

import com.example.demo.model.entity.Resource;
import com.example.demo.model.entity.Role;
import com.example.demo.model.entity.User;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/permissions")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/roles")
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/roles/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        return roleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody Role role) {
        if (roleRepository.findByName(role.getName()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        Role savedRole = roleRepository.save(role);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRole);
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody Role roleDetails) {
        return roleRepository.findById(id)
                .map(role -> {
                    role.setName(roleDetails.getName());
                    role.setDescription(roleDetails.getDescription());
                    return ResponseEntity.ok(roleRepository.save(role));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        if (!roleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        roleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/resources")
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    @PostMapping("/resources")
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        Resource savedResource = resourceRepository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResource);
    }

    @PostMapping("/users/{userId}/roles/{roleId}")
    public ResponseEntity<?> assignRoleToUser(@PathVariable Long userId, @PathVariable Long roleId) {
        User user = userRepository.findById(userId).orElse(null);
        Role role = roleRepository.findById(roleId).orElse(null);

        if (user == null || role == null) {
            return ResponseEntity.notFound().build();
        }

        user.getRoles().add(role);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Role assigned successfully"));
    }

    @DeleteMapping("/users/{userId}/roles/{roleId}")
    public ResponseEntity<?> removeRoleFromUser(@PathVariable Long userId, @PathVariable Long roleId) {
        User user = userRepository.findById(userId).orElse(null);
        Role role = roleRepository.findById(roleId).orElse(null);

        if (user == null || role == null) {
            return ResponseEntity.notFound().build();
        }

        user.getRoles().remove(role);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Role removed successfully"));
    }

    @GetMapping("/users/{userId}/roles")
    @PreAuthorize("hasRole('ROLE_ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<Set<Role>> getUserRoles(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(user.getRoles()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/roles/{roleName}/resources/{resourceId}")
    public ResponseEntity<Role> assignResourceToRole(@PathVariable String roleName, @PathVariable Long resourceId) {
        Role role = permissionService.assignResourceToRole(roleName, resourceId);
        return ResponseEntity.ok(role);
    }

    @DeleteMapping("/roles/{roleId}/resources/{resourceId}")
    public ResponseEntity<?> removeResourceFromRole(@PathVariable Long roleId, @PathVariable Long resourceId) {
        Role role = roleRepository.findById(roleId).orElse(null);
        if (role == null) {
            return ResponseEntity.notFound().build();
        }
        role.getResources().removeIf(resource -> resource.getId().equals(resourceId));
        roleRepository.save(role);
        return ResponseEntity.ok(Map.of("message", "Resource removed from role successfully"));
    }

    @GetMapping("/roles/{roleId}/resources")
    public ResponseEntity<Set<Resource>> getRoleResources(@PathVariable Long roleId) {
        return roleRepository.findById(roleId)
                .map(role -> ResponseEntity.ok(role.getResources()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{userId}/check")
    @PreAuthorize("hasRole('ROLE_ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<?> checkUserPermission(@PathVariable Long userId, @RequestParam String resource) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        boolean hasPermission = user.getRoles().stream()
                .flatMap(role -> role.getResources().stream())
                .anyMatch(r -> r.getName().equals(resource));
        return ResponseEntity.ok(Map.of("hasPermission", hasPermission, "resource", resource));
    }
}