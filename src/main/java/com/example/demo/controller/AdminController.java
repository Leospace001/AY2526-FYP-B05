package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // Only accessible by users who have ROLE_ADMIN
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin user dashboard", security = @SecurityRequirement(name = "bearerAuth"))
    public String getAdminDashboard() {
        return "Welcome to the Admin Dashboard! Access Granted.";
    }
    
    // Accessible by anyone authenticated
    @GetMapping("/profile")
    @Operation(summary = "User profile", security = @SecurityRequirement(name = "bearerAuth"))
    public String getUserProfile() {
        return "Welcome to your profile. Any authenticated user can see this.";
    }
}