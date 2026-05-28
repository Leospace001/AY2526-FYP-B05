package com.example.demo.service;

import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.FileList;
import org.springframework.stereotype.Service;
import java.io.IOException;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import org.springframework.web.multipart.MultipartFile;
import com.google.api.client.http.InputStreamContent;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.HashMap;
import java.util.Map;
import java.io.ByteArrayOutputStream;

@Service
public class DriveService {

    @Autowired(required = false)
    private Drive driveService;

    public boolean isDriveAvailable() {
        return this.driveService != null;
    }

    // @Autowired(required = false)
    // public DriveService(Drive driveService) {
    //     this.driveService = driveService;
    // }

    public  Map<String, Object> listTopFilesPaginated(int pageSize, String pageToken) throws IOException {
        if (!isDriveAvailable()) {
            throw new IllegalStateException("API bean was not built cleanly.");
        }
        Drive.Files.List request = driveService.files().list()
                .setPageSize(pageSize)
                .setFields("nextPageToken, files(id, name, mimeType)");

        if (pageToken != null && !pageToken.trim().isEmpty()) {
            request.setPageToken(pageToken);
        }

        FileList result = request.execute();

         Map<String, Object> response = new HashMap<>();
        response.put("files", result.getFiles());
        response.put("nextPageToken", result.getNextPageToken()); // This will be null on the final page

        return response;
    }

    public File getFileMetadata(String fileId) throws IOException {
        if (!isDriveAvailable()) {
            throw new IllegalStateException("API bean was not built cleanly.");
        }
        return driveService.files().get(fileId).setFields("id, name, mimeType").execute();
    }

    // Handles the actual multi-part file conversion stream
    public String uploadMultipartFile(MultipartFile multipartFile) throws IOException {
        File fileMetadata = new File();
        fileMetadata.setName(multipartFile.getOriginalFilename());

        InputStreamContent mediaContent = new InputStreamContent(
                multipartFile.getContentType(),
                multipartFile.getInputStream()
        );

        File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id")
                .execute();

        return uploadedFile.getId();
    }

    public byte[] downloadFileContent(String fileId) throws IOException {
        if (!isDriveAvailable()) {
            throw new IllegalStateException("API bean was not built cleanly.");
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            // Executes the actual core binary stream dump directly into memory buffer
            driveService.files().get(fileId).executeMediaAndDownloadTo(outputStream);
            return outputStream.toByteArray();
        }
    }
}
