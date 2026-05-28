package com.example.demo.config;

import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.io.InputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.FileNotFoundException;

/**
 * Please create a service account in your Google account and put the credentials file as credentials.json in main/resources/
 * 
 * @author Leo YUEN 220240436@stu.vtc.edu.hk yuen7895123@yahoo.com.hk
 * @version 1.0
 * @since 2025-12-24
 * @see https://github.com/leospace001/
 */

@Configuration
public class GoogleDriveConfig {

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Bean
    public Drive googleDriveService() throws IOException, GeneralSecurityException {
        // Load the credentials file from src/main/resources
        try {
            ClassPathResource resource = new ClassPathResource("credentials.json");

        if (!resource.exists()) {
                throw new FileNotFoundException("credentials.json file is missing in resources folder.");
            }

            try (InputStream in = resource.getInputStream()) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(in)
                    .createScoped(Collections.singleton(DriveScopes.DRIVE)); // Full drive permission

                return new Drive.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("Spring Boot Drive Integration")
                    .build();
            }
        } catch (FileNotFoundException  e) {
            userActivityLogger.error("❌ Google Drive Configuration Error: {}", e.getMessage());
            userActivityLogger.warn("⚠️ Google Drive service will be unavailable. Please add 'credentials.json' to src/main/resources/");
        } catch (IOException e) {
            userActivityLogger.error("❌ Google Drive Configuration Error: Invalid credentials format or network issue.", e);
            userActivityLogger.warn("⚠️ Google Drive service will be unavailable. Please verify the content of your 'credentials.json'.");
        } catch (Exception e) {
            userActivityLogger.error("❌ Unexpected error while initializing Google Drive API", e);
        }
            return null;
    }
}