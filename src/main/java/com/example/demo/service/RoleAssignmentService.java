package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.dto.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoleAssignmentService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleAssignmentRepository userRoleRepository;

    @Transactional
    public void grantAdminRole(User user) {
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN).orElseThrow();

        // Check if they already have an active admin role
        boolean alreadyAdmin = user.getRoleAssignments().stream()
            .anyMatch(a -> a.isActive() && a.getRole().getName().equals(ERole.ROLE_ADMIN));

        if (!alreadyAdmin) {
            UserRoleAssignment newAssignment = new UserRoleAssignment(user, adminRole);
            userRoleRepository.save(newAssignment); // Cascade takes care of saving the assignment
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

    public List<RoleMemberDto> getMembersByRoleId(Long roleId) {
        // Query database and map to DTO
        return userRoleRepository.findByRoleId(roleId).stream()
            .collect(Collectors.groupingBy(
                assignment -> assignment.getUser().getId(),
                    Collectors.collectingAndThen(
                    Collectors.maxBy(Comparator.comparing(UserRoleAssignment::getAssignedDate)),
                    optional -> optional.map(assignment -> new RoleMemberDto(
                        assignment.getUser().getId(),
                        assignment.getUser().getUsername(),
                        assignment.getUser().getEmail(),
                        assignment.getAssignedDate(),
                        assignment.isActive()
                    ))
                )
            ))
                .values().stream()
                .filter(Optional::isPresent)
                .map(Optional::get)
                .distinct()
                .collect(Collectors.toList());
            }

    public List<RoleMemberDto> getActiveMembersByRoleId(Long roleId) {
        List<RoleMemberDto> roleMember = getMembersByRoleId(roleId);
        return roleMember.stream()
            .filter(RoleMemberDto::isActive)
            .distinct()
            .collect(Collectors.toList());

    }
        
}

    

