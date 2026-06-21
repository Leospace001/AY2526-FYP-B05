package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import com.example.demo.service.UserService;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.dto.UserInfo;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;
    
    @GetMapping
    @Operation(summary = "Get users (Admin gets all, Normal user gets only themselves)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<UserInfo>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "username") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            Authentication authentication) {

        // 1. Check if the requester is an Admin
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // 🚀 ADMIN: Return the full paginated database
            Page<UserInfo> allUsers = userService.getPaginatedUsers(page, size, sortBy, sortDir);
            return ResponseEntity.ok(allUsers);
        } else {
            // 🚀 NORMAL USER: Extract their identity directly from the token
            CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
            User user = userService.getUserByUsername(userPrincipal.getUsername());
            UserInfo userInfo = userService.toUserInfo(user);

            // Wrap their single profile into a Page format so the frontend doesn't break
            Page<UserInfo> singleUserPage = new PageImpl<>(
                Collections.singletonList(userInfo), 
                PageRequest.of(0, 1), 
                1
            );
            
            return ResponseEntity.ok(singleUserPage);
        }
    }


    @PutMapping("/{username}")
    // 🚀 THE BOUNCER: You can only enter if the URL matches your token's username, OR if you are an Admin!
    @PreAuthorize("#username == authentication.principal.username or hasRole('ADMIN')")
    @Operation(summary = "Update user, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> updateUser(
            @PathVariable String username,
            @RequestBody UserInfo userInfo,
            Authentication authentication) { // 🚀 Inject the token data
            
        // 1. Check if the person making this request holds the ADMIN role
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // 2. Pass the username, the form data, and the admin status to the service.
        // If isAdmin is false, the service will refuse to change the account's active/inactive status!
        User user = userService.updateUser(username, userInfo, isAdmin);
        UserInfo updatedUserInfo = userService.toUserInfo(user);
        
        return ResponseEntity.ok(updatedUserInfo);
    }

    @PostMapping("/{username}/roles/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Grant admin role to a user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> grantAdminRole(
            @PathVariable String username,
            Authentication authentication) {
        CustomUserDetails actingAdmin = (CustomUserDetails) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(userService.grantAdminRole(username, actingAdmin.getUsername()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{username}/roles/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Revoke admin role from a user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> revokeAdminRole(
            @PathVariable String username,
            Authentication authentication) {
        CustomUserDetails actingAdmin = (CustomUserDetails) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(userService.revokeAdminRole(username, actingAdmin.getUsername()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{username}/active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enable or disable a user account", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> setUserActive(
            @PathVariable String username,
            @RequestBody Map<String, Boolean> body,
            Authentication authentication) {
        CustomUserDetails actingAdmin = (CustomUserDetails) authentication.getPrincipal();
        Boolean active = body.get("active");
        if (active == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(userService.setUserActive(username, active, actingAdmin.getUsername()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}