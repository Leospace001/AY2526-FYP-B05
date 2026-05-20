package com.example.demo.service;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.repository.EmailRecordRepository;
import com.example.demo.model.EmailRecord;
import com.example.demo.mapper.EmailRecordMapper;
import com.example.demo.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.File;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.*;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailRecordMapper emailRecordMapper;

    @Autowired
    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public void scheduleEmail(EmailRequestDto request, User sender) {

        // 2. Logic for delivery timing
        if (request.getSendTime() != null && request.getSendTime().isAfter(java.time.LocalDateTime.now())) {
        // if (true) {
            EmailRecord record = emailRecordMapper.emailRequestDtoToEmailRecord(request);
            record.setCreatedBy(sender);
            record.setRecipients(request.getRecipients());
            record.setScheduledSendTime(request.getSendTime());
            record.setSent(false);
            emailRecordRepository.save(record);
        } else {
            sendEmailImmediately(request, sender);
        }
    }


    @Async
    public void sendEmailImmediately(EmailRequestDto request, User sender) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true); // true for multipart
            EmailRecord record = emailRecordMapper.emailRequestDtoToEmailRecord(request);
            record.setCreatedBy(sender);
            

            // Multiple recipients (must be a String Array)
            helper.setTo(request.getRecipients().toArray(new String[0]));
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), true); // true for HTML

            // Multiple Attachments
            if (request.getAttachments() != null) {
                List<String> attachmentPaths = new ArrayList<>();
                for (MultipartFile file : request.getAttachments()) {
                    if (!file.isEmpty()) {
                        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        Path targetPath = Paths.get(uploadDir).resolve(fileName);
                        Files.createDirectories(targetPath.getParent());
                        file.transferTo(targetPath.toFile());
                        attachmentPaths.add(targetPath.toString());
                        helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
                    }
                }
                record.setAttachmentPaths(attachmentPaths);
            }

            // mailSender.send(message);
            emailRecordRepository.save(record);
        } catch (Exception e) {
            userActivityLogger.error("Failed to send email", e);
            // Handle email exception (log to DB, retry, etc.)
        }
    }
}
