package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class RoleAssignmentService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Transactional
    public void grantAdminRole(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN).orElseThrow();

        // Check if they already have an active admin role
        boolean alreadyAdmin = user.getRoleAssignments().stream()
            .anyMatch(a -> a.isActive() && a.getRole().getName().equals(ERole.ROLE_ADMIN));

        if (!alreadyAdmin) {
            UserRoleAssignment newAssignment = new UserRoleAssignment(user, adminRole);
            user.getRoleAssignments().add(newAssignment);
            userRepository.save(user); // Cascade takes care of saving the assignment
        }
    }

    @Transactional
    public void revokeAdminRole(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        // Find the active admin assignment and mark it inactive with a removal date
        user.getRoleAssignments().stream()
            .filter(a -> a.isActive() && a.getRole().getName().equals(ERole.ROLE_ADMIN))
            .findFirst()
            .ifPresent(assignment -> {
                assignment.setActive(false);
            });

        userRepository.save(user);
    }
}