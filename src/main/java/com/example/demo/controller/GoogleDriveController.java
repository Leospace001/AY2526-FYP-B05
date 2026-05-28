package com.example.demo.controller;

import com.google.api.services.drive.model.File;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;
import com.example.demo.service.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drive")
public class GoogleDriveController {

    private final DriveService driveService;

    // Constructor Injection (Injects the service layer)
    public GoogleDriveController(DriveService driveService) {
        this.driveService = driveService;
    }

    /**
     * Endpoint 1: List top 10 files in Google Drive
     * GET http://localhost:8080/api/drive/files
     */
    @GetMapping("/files")
    @Operation(summary = "Update user, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<File>> listFiles() {
        try {
            List<File> files = driveService.listTopFiles(10);
            return ResponseEntity.ok(files);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint 2: Upload a file to Google Drive
     * POST http://localhost:8080/api/drive/upload
     */
    @PostMapping("/upload")
    @Operation(summary = "Update user, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
        }

        try {
            String fileId = driveService.uploadMultipartFile(file);
            return ResponseEntity.ok(Map.of(
                "message", "Successfully uploaded",
                "fileId", fileId,
                "fileName", file.getOriginalFilename()
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}
