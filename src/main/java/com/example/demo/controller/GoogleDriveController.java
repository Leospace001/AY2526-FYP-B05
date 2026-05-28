package com.example.demo.controller;

import com.google.api.services.drive.model.File;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import com.example.demo.service.*;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.core.io.InputStreamResource;
import com.example.demo.dto.GoogleDriveDto;
import io.swagger.v3.oas.annotations.Parameter;

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
    public ResponseEntity<?> listFiles(
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize,
            @RequestParam(value = "pageToken", required = false) String pageToken
    ) {
        try {
            // Fetch the raw wrapped response from our service layer
            Map<String, Object> paginationResult = driveService.listTopFilesPaginated(pageSize, pageToken);
            return ResponseEntity.ok(paginationResult);
            
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Google Drive cloud integration is disabled: " + e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve directory payload: " + e.getMessage()));
        }
    }

    /**
     * Endpoint 2: Upload a file to Google Drive
     * POST http://localhost:8080/api/drive/upload
     */
    @PostMapping(value="/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "upload file to google drive", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, String>> uploadFile(
        @Parameter(required = false) @ModelAttribute GoogleDriveDto request
    ) {
        MultipartFile file = request.getAttachments();
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

    @GetMapping("/download/{fileId}")
    @Operation(summary = "Update user, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> downloadFile(@PathVariable String fileId) {
        try {
            // 1. Fetch file metadata (to get the authentic file name and mime type)
            File fileMetadata = driveService.getFileMetadata(fileId);
            
            // 2. Fetch file content bytes stream
            byte[] fileBytes = driveService.downloadFileContent(fileId);
            InputStreamResource resource = new InputStreamResource(new ByteArrayInputStream(fileBytes));

            // 3. Build stream headers forcing the client browser to open a download dialogue
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileMetadata.getName() + "\"")
                    .contentType(MediaType.parseMediaType(fileMetadata.getMimeType()))
                    .contentLength(fileBytes.length)
                    .body(resource);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Google Drive cloud integration is disabled: " + e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "File download failed. Check ID validity or access rights: " + e.getMessage()));
        }
    }
}
