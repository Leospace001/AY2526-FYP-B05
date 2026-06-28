package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.example.demo.dto.RegistrationEmailSettingDto;
import com.example.demo.dto.LogEventDto;
import com.example.demo.dto.EmailTemplateDto;
import com.example.demo.dto.UpdateEmailTemplateDto;
import com.example.demo.dto.PreviewEmailTemplateDto;
import com.example.demo.dto.EmailTemplatePreviewResultDto;
import com.example.demo.service.*;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    @Autowired
    private AppSettingService appSettingService;

    @Autowired
    private LogEventService logEventService;

    @Autowired
    private EmailTemplateService emailTemplateService;

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

    @GetMapping("/settings/registration-email")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get registration welcome email setting", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<RegistrationEmailSettingDto> getRegistrationEmailSetting() {
        return ResponseEntity.ok(new RegistrationEmailSettingDto(appSettingService.isRegistrationEmailEnabled()));
    }

    @PatchMapping("/settings/registration-email")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enable or disable registration welcome email", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<RegistrationEmailSettingDto> setRegistrationEmailSetting(
            @RequestBody RegistrationEmailSettingDto setting) {
        boolean enabled = appSettingService.setRegistrationEmailEnabled(setting.isEnabled());
        return ResponseEntity.ok(new RegistrationEmailSettingDto(enabled));
    }

    @GetMapping("/log-events")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List user activity log events", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<LogEventDto>> getLogEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String username) {
        return ResponseEntity.ok(logEventService.getPaginatedLogEvents(page, size, username));
    }

    @GetMapping("/email-templates")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List editable email templates", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<EmailTemplateDto>> listEmailTemplates() {
        return ResponseEntity.ok(emailTemplateService.listTemplates());
    }

    @GetMapping("/email-templates/{templateKey}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get an email template", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailTemplateDto> getEmailTemplate(@PathVariable String templateKey) {
        return ResponseEntity.ok(emailTemplateService.getTemplate(templateKey));
    }

    @PutMapping("/email-templates/{templateKey}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an email template", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailTemplateDto> updateEmailTemplate(
            @PathVariable String templateKey,
            @RequestBody UpdateEmailTemplateDto update) {
        return ResponseEntity.ok(emailTemplateService.updateTemplate(templateKey, update));
    }

    @PostMapping("/email-templates/{templateKey}/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset an email template to its default content", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailTemplateDto> resetEmailTemplate(@PathVariable String templateKey) {
        return ResponseEntity.ok(emailTemplateService.resetTemplate(templateKey));
    }

    @PostMapping("/email-templates/{templateKey}/preview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Preview email template HTML with sample data", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailTemplatePreviewResultDto> previewEmailTemplate(
            @PathVariable String templateKey,
            @RequestBody PreviewEmailTemplateDto preview) {
        String renderedHtml = emailTemplateService.previewHtml(templateKey, preview.getHtmlContent());
        return ResponseEntity.ok(new EmailTemplatePreviewResultDto(renderedHtml));
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

    @PostMapping(value = "/base64", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "convert image to base 64 sring", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, String>> identifyPlant(@RequestParam("image") MultipartFile file) {
        try {
            // 1. Get the dynamic MIME type (e.g., "image/jpeg" or "image/png")
            String mimeType = file.getContentType();
            
            // Optional but recommended: Add a quick server-side security check!
            if (mimeType == null || !mimeType.startsWith("image/")) {
                Map<String, String> noImageResponse = new HashMap<>();
                noImageResponse.put("error", "images is required");

                return ResponseEntity.badRequest().body(noImageResponse);
            }

            // 2. Convert the raw bytes into a Base64 String
            byte[] imageBytes = file.getBytes();
            String rawBase64 = Base64.getEncoder().encodeToString(imageBytes);

            // 3. Construct the exact Data URI format your AI endpoint wants
            String fullBase64String = "data:" + mimeType + ";base64," + rawBase64;
            Map<String, String> responseData = new HashMap<>();
            responseData.put("base64Image", fullBase64String);

            // --- YOU NOW HAVE THE PERFECT STRING! ---
            // Example output: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."
            // Send 'fullBase64String' to your AI model here!
            
            // 4. Return the result back to your React frontend
            return ResponseEntity.ok().body(responseData);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}