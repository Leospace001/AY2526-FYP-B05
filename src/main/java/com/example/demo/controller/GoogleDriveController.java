package com.example.demo.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.service.GoogleDriveService;
import java.util.*;

@RestController
@RequestMapping("/api/drive")
public class GoogleDriveController {

    @Autowired
    private GoogleDriveService driveService;

    @GetMapping("/files")
    public List<File> getFiles() throws IOException {
        return driveService.listFiles();
    }
    
    @PostMapping("/upload")
    public ResponseEntity<String> upload(
        @RequestParam("file") MultipartFile file, 
        @RequestParam("folderId") String folderId
    ) {
        try {
            String fileId = driveService.uploadFile(file, folderId);
            return ResponseEntity.ok("File uploaded successfully. ID: " + fileId);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> download(@PathVariable String fileId) {
        try {
            byte[] data = driveService.downloadFile(fileId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"downloaded_file\"")
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }
}