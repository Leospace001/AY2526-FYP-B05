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
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import com.example.demo.config.RabbitConfig;

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

    @Value("${spring.mail.username}")
    private String senderEmailAddress;

    @Value("${rabbitmq.queue.name}")
    private String queue;

    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void scheduleEmail(EmailRequestDto record) {

        // 2. Logic for delivery timing
        if (record.getSendTime() != null && record.getSendTime().isAfter(java.time.LocalDateTime.now())) {
            
        } else {
            sendEmailImmediately(record);
        }
    }


    @Async
    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void sendEmailImmediately(EmailRequestDto request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8"); // true for multipart
            // EmailRecord record = emailRecordMapper.emailRequestDtoToEmailRecord(request);
            // record.setCreatedBy(sender);
            

            // Multiple recipients (must be a String Array)
            helper.setTo(request.getRecipients().toArray(new String[0]));
            helper.setFrom(senderEmailAddress);
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), true); // true for HTML

            //Multiple Attachments
            if (request.getAttachments() != null) {
                for (MultipartFile file : request.getAttachments()) {
                    if (!file.isEmpty()) {
                        // String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        // Path targetPath = Paths.get(uploadDir).resolve(fileName);
                        // Files.createDirectories(targetPath.getParent());
                        // file.transferTo(targetPath.toFile());
                        helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
                    }
                }
                // request.setAttachmentPaths(attachmentPaths);
            }

            mailSender.send(message);
            // emailRecordRepository.save(request);
        } catch (Exception e) {
            userActivityLogger.error("Failed to send email", e);
            // Handle email exception (log to DB, retry, etc.)
        }
    }
}
