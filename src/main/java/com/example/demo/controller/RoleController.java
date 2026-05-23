package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.dto.RoleMemberDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import com.example.demo.service.RoleAssignmentService;
import java.util.*;

@RestController
@RequestMapping("/api/role")
public class RoleController {

    @Autowired
    private RoleAssignmentService roleAssignmentService;

    @GetMapping("/{roleId}")
    @Operation(summary = "Get members in role", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<RoleMemberDto>> getRoleMember(
            @PathVariable Long roleId,
           Authentication authentication) {       
        return ResponseEntity.ok(roleAssignmentService.getMembersByRoleId(roleId));
    }

    @GetMapping("/active/{roleId}")
    @Operation(summary = "Get active members in role", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<RoleMemberDto>> getActiveRoleMember(
            @PathVariable Long roleId,
           Authentication authentication) {       
        return ResponseEntity.ok(roleAssignmentService.getActiveMembersByRoleId(roleId));
    }
}
