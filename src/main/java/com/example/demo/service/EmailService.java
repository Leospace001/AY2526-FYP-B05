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

            // Multiple recipients (must be a String Array)
            helper.setTo(request.getRecipients().toArray(new String[0]));
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), true); // true for HTML

            // Multiple Attachments
            if (request.getAttachments() != null) {
                for (MultipartFile file : request.getAttachments()) {
                    if (!file.isEmpty()) {
                        helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
                    }
                }
            }

            mailSender.send(message);
            EmailRecord record = emailRecordMapper.emailRequestDtoToEmailRecord(request);
            record.setCreatedBy(sender);
            record.setSent(true);
            emailRecordRepository.save(record);
        } catch (Exception e) {
            userActivityLogger.error("Failed to send email", e);
            // Handle email exception (log to DB, retry, etc.)
        }
    }
}
