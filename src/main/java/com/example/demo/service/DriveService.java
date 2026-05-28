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

@Service
public class DriveService {

    @Autowired(required = false)
    private Drive driveService;

    // @Autowired(required = false)
    // public DriveService(Drive driveService) {
    //     this.driveService = driveService;
    // }

    public List<File> listTopFiles(int pageSize) throws IOException {
        FileList result = driveService.files().list()
                .setPageSize(pageSize)
                .setFields("nextPageToken, files(id, name, mimeType)")
                .execute();
        return result.getFiles();
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
}
