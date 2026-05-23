package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import com.example.demo.service.*;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    @Value("${file.upload-dir}")
    private String uploadsDir;

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

    @GetMapping(value = "/image/{fileName}")
    @Operation(summary = "get image from server", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) throws IOException {
        Path imagePath = Paths.get(uploadsDir + fileName);
        
        // Ensure file exists (optional, add 404 handling as needed)
        if (!Files.exists(imagePath)) {
            return ResponseEntity.notFound().build();
        }

        byte[] imageBytes = Files.readAllBytes(imagePath);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG) // Adjust dynamically based on file type if needed
                .body(imageBytes);
    }


}