package com.example.demo.service;

import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import com.google.api.services.drive.model.File;

@Service
public class GoogleDriveService {

    private final Drive driveService;

    public GoogleDriveService(Drive driveService) {
        this.driveService = driveService;
    }

    public List<File> listFiles() throws IOException {
    FileList result = driveService.files().list()
        .setPageSize(10)
        .setFields("nextPageToken, files(id, name, mimeType)") // Limit fields for performance
        .execute();

    List<File> files = result.getFiles();
        if (files == null || files.isEmpty()) {
            System.out.println("No files found.");
        }
    return files;
}
    
    // Upload file to a specific shared folder
    public String uploadFile(MultipartFile file, String folderId) throws IOException {
        com.google.api.services.drive.model.File fileMetadata = new com.google.api.services.drive.model.File();
        fileMetadata.setName(file.getOriginalFilename());
        fileMetadata.setParents(Collections.singletonList(folderId));

        InputStreamContent mediaContent = new InputStreamContent(
                file.getContentType(),
                file.getInputStream()
        );

        com.google.api.services.drive.model.File uploadedFile = driveService.files()
                .create(fileMetadata, mediaContent)
                .setFields("id")
                .execute();

        return uploadedFile.getId();
    }

    // Download file content via File ID
    public byte[] downloadFile(String fileId) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        driveService.files().get(fileId)
                .executeMediaAndDownloadTo(outputStream);
        return outputStream.toByteArray();
    }
}