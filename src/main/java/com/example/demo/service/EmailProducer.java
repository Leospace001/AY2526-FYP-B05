package com.example.demo.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.config.AppTimeZone;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.model.User;
import com.example.demo.repository.EmailRecordJdbcRepository;

@Service
public class EmailProducer {

    private static final Logger logger = LoggerFactory.getLogger(EmailProducer.class);

    @Autowired
    private EmailRecordJdbcRepository emailRecordJdbcRepository;

    @Autowired
    private EmailDispatchService emailDispatchService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public void sendEmailToQueue(EmailRequestDto emailDto, User user) {
        validateEmailRequest(emailDto);

        try {
            List<String> attachmentPaths = new ArrayList<>();
            if (emailDto.getAttachments() != null && !emailDto.getAttachments().isEmpty()) {
                for (MultipartFile file : emailDto.getAttachments()) {
                    if (!file.isEmpty()) {
                        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        Path targetPath = Paths.get(uploadDir).resolve(fileName);
                        Files.createDirectories(targetPath.getParent());
                        file.transferTo(targetPath.toFile());
                        attachmentPaths.add(targetPath.toString());
                    }
                }
            }
            addValidatedReuseAttachmentPaths(emailDto.getReuseAttachmentPaths(), attachmentPaths);

            Long recordId = emailRecordJdbcRepository.insertEmail(
                    user.getId(),
                    new ArrayList<>(emailDto.getRecipients()),
                    emailDto.getSubject(),
                    emailDto.getBody(),
                    attachmentPaths,
                    emailDto.getSendTime());

            emailDispatchService.dispatchIfDue(recordId, emailDto.getSendTime());
            logger.info("Successfully saved email record ID: {}", recordId);

        } catch (Exception e) {
            logger.error("Failed to process and queue email request", e);
            throw new RuntimeException("Could not queue email: " + e.getMessage(), e);
        }
    }

    private void validateEmailRequest(EmailRequestDto emailDto) {
        if (emailDto == null) {
            throw new IllegalArgumentException("Email request is missing. Use multipart/form-data with recipients, subject, and body.");
        }
        if (emailDto.getRecipients() == null || emailDto.getRecipients().isEmpty()) {
            throw new IllegalArgumentException("At least one recipient is required.");
        }
        if (emailDto.getSubject() == null || emailDto.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (emailDto.getBody() == null || emailDto.getBody().isBlank()) {
            throw new IllegalArgumentException("Email body is required.");
        }
        if (emailDto.getSendTime() != null && !emailDto.getSendTime().isAfter(AppTimeZone.now())) {
            throw new IllegalArgumentException(
                    "Scheduled send time must be in the future (" + AppTimeZone.LABEL + ").");
        }
    }

    private void addValidatedReuseAttachmentPaths(List<String> reusePaths, List<String> attachmentPaths) {
        if (reusePaths == null || reusePaths.isEmpty()) {
            return;
        }
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        for (String reusePath : reusePaths) {
            if (reusePath == null || reusePath.isBlank()) {
                continue;
            }
            Path resolved = Paths.get(reusePath).toAbsolutePath().normalize();
            if (!resolved.startsWith(uploadRoot)) {
                throw new IllegalArgumentException("Invalid attachment path.");
            }
            if (!Files.exists(resolved)) {
                throw new IllegalArgumentException("An attachment from the copied email is no longer available on the server.");
            }
            if (!attachmentPaths.contains(resolved.toString())) {
                attachmentPaths.add(resolved.toString());
            }
        }
    }
}
