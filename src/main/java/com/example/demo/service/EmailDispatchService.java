package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.config.AppTimeZone;
import com.example.demo.dto.EmailMessageDto;
import com.example.demo.model.EmailRecord;
import com.example.demo.repository.EmailRecordJdbcRepository;
import com.example.demo.repository.EmailRecordRepository;

@Service
public class EmailDispatchService {

    private static final Logger logger = LoggerFactory.getLogger(EmailDispatchService.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Autowired
    private EmailRecordJdbcRepository emailRecordJdbcRepository;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Transactional
    public void dispatchIfDue(EmailRecord record) {
        if (record.isSent() || record.isDispatched()) {
            return;
        }
        if (record.getScheduledSendTime() != null && record.getScheduledSendTime().isAfter(AppTimeZone.now())) {
            return;
        }
        dispatchToQueue(record);
    }

    @Transactional
    public void dispatchToQueue(Long recordId) {
        EmailMessageDto messageDto = new EmailMessageDto(recordId);
        rabbitTemplate.convertAndSend(exchange, routingKey, messageDto);
        emailRecordJdbcRepository.markDispatched(recordId);
        logger.info("Queued email record ID: {}", recordId);
    }

    @Transactional
    public void dispatchToQueue(EmailRecord record) {
        if (record.isSent() || record.isDispatched()) {
            return;
        }
        EmailMessageDto messageDto = new EmailMessageDto(record.getId());
        rabbitTemplate.convertAndSend(exchange, routingKey, messageDto);
        record.setDispatched(true);
        emailRecordRepository.save(record);
        logger.info("Queued email record ID: {}", record.getId());
    }
}
