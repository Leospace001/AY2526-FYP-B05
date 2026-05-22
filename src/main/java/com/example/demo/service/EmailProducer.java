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
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.example.demo.mapper.EmailRecordMapper;

@Service
public class EmailProducer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private EmailRecordMapper emailRecordMapper;

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Value("${rabbitmq.queue.name}")
    private String queue;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public void sendEmailToQueue(EmailRequestDto emailDto, User user) {
        EmailRecord record = emailRecordMapper.emailRequestDtoToEmailRecord(emailDto);
        record.setRecipients(emailDto.getRecipients());
        record.setScheduledSendTime(emailDto.getSendTime());
        record.setCreatedBy(user);
        record.setSent(false);

        try {
            if (emailDto.getAttachments() != null) {
                List<String> attachmentPaths = new ArrayList<>();
                for (MultipartFile file : emailDto.getAttachments()) {
                    if (!file.isEmpty()) {
                        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        Path targetPath = Paths.get(uploadDir).resolve(fileName);
                        Files.createDirectories(targetPath.getParent());
                        file.transferTo(targetPath.toFile());
                        attachmentPaths.add(targetPath.toString());
                        // helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
                    }
                }
                record.setAttachmentPaths(attachmentPaths);
            }
        emailRecordRepository.save(record);
        rabbitTemplate.convertAndSend(exchange, routingKey, emailDto);

        } catch (Exception e) {

        }
        
    }

}