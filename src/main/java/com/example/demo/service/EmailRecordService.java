package com.example.demo.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.config.AppTimeZone;
import com.example.demo.dto.EmailRecordSummaryDto;
import com.example.demo.dto.UpdateScheduledEmailDto;
import com.example.demo.model.EmailRecord;
import com.example.demo.model.User;
import com.example.demo.repository.EmailRecordRepository;

@Service
public class EmailRecordService {

    @Autowired
    private EmailRecordRepository emailRecordRepository;

    @Autowired
    private EmailDispatchService emailDispatchService;

    @Transactional(readOnly = true)
    public List<EmailRecordSummaryDto> listSentByUser(User user) {
        return emailRecordRepository.findByCreatedBy_IdAndSentTrueOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmailRecordSummaryDto> listScheduledByUser(User user) {
        return emailRecordRepository
                .findByCreatedBy_IdAndSentFalseAndScheduledSendTimeNotNullAndScheduledSendTimeAfterOrderByScheduledSendTimeAsc(
                        user.getId(), AppTimeZone.now())
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmailRecordSummaryDto> listOutboxByUser(User user) {
        return emailRecordRepository.findByCreatedBy_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmailRecordSummaryDto getOutboxItem(User user, Long id) {
        EmailRecord record = getOwnedRecord(user, id);
        return toSummaryDto(record);
    }

    @Transactional
    public EmailRecordSummaryDto updateScheduledEmail(User user, Long id, UpdateScheduledEmailDto update) {
        EmailRecord record = getOwnedRecord(user, id);
        if (!isEditable(record)) {
            throw new IllegalArgumentException("Only unsent scheduled emails can be edited.");
        }
        if (update.getRecipients() == null || update.getRecipients().isEmpty()) {
            throw new IllegalArgumentException("At least one recipient is required.");
        }
        if (update.getSubject() == null || update.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (update.getBody() == null || update.getBody().isBlank()) {
            throw new IllegalArgumentException("Email body is required.");
        }
        if (update.getSendTime() == null || !update.getSendTime().isAfter(AppTimeZone.now())) {
            throw new IllegalArgumentException(
                    "Scheduled send time must be in the future (" + AppTimeZone.LABEL + ").");
        }

        record.setRecipients(new ArrayList<>(update.getRecipients()));
        record.setSubject(update.getSubject().trim());
        record.setBody(update.getBody());
        record.setScheduledSendTime(update.getSendTime());
        return toSummaryDto(emailRecordRepository.save(record));
    }

    @Transactional
    public void cancelScheduledEmail(User user, Long id) {
        EmailRecord record = getOwnedRecord(user, id);
        if (!isEditable(record)) {
            throw new IllegalArgumentException("Only unsent scheduled emails can be cancelled.");
        }
        emailRecordRepository.delete(record);
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void dispatchDueScheduledEmails() {
        List<EmailRecord> dueRecords = emailRecordRepository
                .findBySentFalseAndDispatchedFalseAndScheduledSendTimeLessThanEqual(AppTimeZone.now());
        for (EmailRecord record : dueRecords) {
            emailDispatchService.dispatchToQueue(record);
        }
    }

    private EmailRecord getOwnedRecord(User user, Long id) {
        return emailRecordRepository.findByIdAndCreatedBy_Id(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Email not found."));
    }

    private boolean isEditable(EmailRecord record) {
        return !record.isSent()
                && !record.isDispatched()
                && record.getScheduledSendTime() != null
                && record.getScheduledSendTime().isAfter(AppTimeZone.now());
    }

    private EmailRecordSummaryDto toSummaryDto(EmailRecord record) {
        return new EmailRecordSummaryDto(
                record.getId(),
                record.getRecipients() != null ? record.getRecipients() : List.of(),
                record.getSubject(),
                record.getBody(),
                record.getScheduledSendTime(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.isSent(),
                record.isDispatched(),
                isEditable(record),
                AppTimeZone.ID);
    }
}
