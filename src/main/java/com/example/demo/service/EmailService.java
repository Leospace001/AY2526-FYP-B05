package com.example.demo.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.dto.EmailMessageDto;
import com.example.demo.repository.EmailRecordRepository;
import com.example.demo.model.EmailRecord;
import org.springframework.mail.MailException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.Optional;

@Service
public class EmailService {

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Value("${spring.mail.username}")
    private String senderEmailAddress;

    // Single listener taking the lightweight DTO
    @Transactional
    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void processQueuedEmail(EmailMessageDto messageDto) {
        userActivityLogger.info("Picked up email job for Record ID: {}", messageDto.getEmailRecordId());

        // 1. Fetch the full record from the DB
        Optional<EmailRecord> optionalRecord = emailRecordRepository.findById(messageDto.getEmailRecordId());
        if (optionalRecord.isEmpty()) {
            userActivityLogger.error("EmailRecord not found for ID: {}", messageDto.getEmailRecordId());
            return; 
        }

        EmailRecord record = optionalRecord.get();

        // 2. Logic for delivery timing
        if (record.getScheduledSendTime() != null && record.getScheduledSendTime().isAfter(java.time.LocalDateTime.now())) {
            userActivityLogger.info("Email is scheduled for future delivery. (Note: Standard RabbitMQ requires a delayed-message plugin for this).");
            // You will need a way to handle delays here, otherwise it sends immediately.
            sendEmailImmediately(record);
        } else {
            sendEmailImmediately(record);
        }
    }

    private void sendEmailImmediately(EmailRecord record) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(record.getRecipients().toArray(new String[0]));
            helper.setFrom(senderEmailAddress);
            helper.setSubject(record.getSubject()); // Assuming EmailRecord has getSubject()
            helper.setText(record.getBody(), true); // Assuming EmailRecord has getBody()

            // 3. Attach files using FileSystemResource and the saved paths
            if (record.getAttachmentPaths() != null) {
                for (String path : record.getAttachmentPaths()) {
                    File file = new File(path);
                    if (file.exists()) {
                        FileSystemResource resource = new FileSystemResource(file);
                        helper.addAttachment(file.getName(), resource);
                    } else {
                        userActivityLogger.warn("Attachment file not found on disk: {}", path);
                    }
                }
            }

            mailSender.send(message);
            
            // 4. Mark as sent in DB
            record.setSent(true);
            emailRecordRepository.save(record);
            userActivityLogger.info("Email sent successfully for Record ID: {}", record.getId());

        } catch (MailException e) {
            userActivityLogger.error("Mail reachable", record.getId(), e);
        } catch (Exception e) {
            userActivityLogger.error("Failed to send email for Record ID: {}", record.getId(), e);
        }
    }
}