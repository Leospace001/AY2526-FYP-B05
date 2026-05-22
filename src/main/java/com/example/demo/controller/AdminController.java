package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.service.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    @GetMapping("/rabbitmq")
    @Operation(summary = "User profile", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<String> sendMessage(@RequestParam("message") String message) {
        rabbitMQProducer.sendMessage(message);
        return ResponseEntity.ok("Message sent");

    }



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