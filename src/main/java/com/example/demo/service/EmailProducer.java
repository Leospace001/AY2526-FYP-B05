package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import com.example.demo.dto.EmailRequestDto;
import com.example.demo.dto.EmailMessageDto;
import com.example.demo.repository.EmailRecordRepository;
import com.example.demo.model.EmailRecord;
import com.example.demo.mapper.EmailRecordMapper;
import com.example.demo.model.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.*;

@Service
public class EmailProducer {

    private static final Logger logger = LoggerFactory.getLogger(EmailProducer.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private EmailRecordMapper emailRecordMapper;

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public void sendEmailToQueue(EmailRequestDto emailDto, User user) {
        validateEmailRequest(emailDto);

        EmailRecord record = emailRecordMapper.emailRequestDtoToEmailRecord(emailDto);
        record.setRecipients(emailDto.getRecipients());
        record.setScheduledSendTime(emailDto.getSendTime());
        record.setCreatedBy(user);
        record.setSent(false);

        try {
            if (emailDto.getAttachments() != null && !emailDto.getAttachments().isEmpty()) {
                List<String> attachmentPaths = new ArrayList<>();
                for (MultipartFile file : emailDto.getAttachments()) {
                    if (!file.isEmpty()) {
                        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        Path targetPath = Paths.get(uploadDir).resolve(fileName);
                        Files.createDirectories(targetPath.getParent());
                        file.transferTo(targetPath.toFile());
                        attachmentPaths.add(targetPath.toString());
                    }
                }
                record.setAttachmentPaths(attachmentPaths);
            }

            record = emailRecordRepository.save(record);

            EmailMessageDto messageDto = new EmailMessageDto(record.getId());
            rabbitTemplate.convertAndSend(exchange, routingKey, messageDto);
            logger.info("Successfully queued email record ID: {}", record.getId());

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
    }
}