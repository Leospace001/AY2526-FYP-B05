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
import com.example.demo.model.User;
import com.example.demo.repository.EmailRecordJdbcRepository;

@Service
public class EmailRecordService {

    @Autowired
    private EmailRecordJdbcRepository emailRecordJdbcRepository;

    @Autowired
    private EmailDispatchService emailDispatchService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Transactional(readOnly = true)
    public List<EmailRecordSummaryDto> listSentByUser(User user) {
        return enrichSummaries(emailRecordJdbcRepository.findSentByUser(user.getId()));
    }

    @Transactional(readOnly = true)
    public List<EmailRecordSummaryDto> listScheduledByUser(User user) {
        return enrichSummaries(emailRecordJdbcRepository.findScheduledByUser(user.getId(), AppTimeZone.now()));
    }

    @Transactional(readOnly = true)
    public List<EmailRecordSummaryDto> listOutboxByUser(User user) {
        return enrichSummaries(emailRecordJdbcRepository.findOutboxByUser(user.getId()));
    }

    @Transactional(readOnly = true)
    public EmailRecordSummaryDto getOutboxItem(User user, Long id) {
        EmailRecordSummaryDto summary = emailRecordJdbcRepository.findSummaryByIdAndUser(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Email not found."));
        return enrichSummary(summary);
    }

    @Transactional
    public EmailRecordSummaryDto updateScheduledEmail(User user, Long id, UpdateScheduledEmailDto update) {
        EmailRecordSummaryDto existing = getOutboxItem(user, id);
        if (!existing.isEditable()) {
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

        emailRecordJdbcRepository.updateScheduledEmail(
                id,
                user.getId(),
                new ArrayList<>(update.getRecipients()),
                update.getSubject().trim(),
                update.getBody(),
                update.getSendTime());
        return getOutboxItem(user, id);
    }

    @Transactional
    public void cancelScheduledEmail(User user, Long id) {
        EmailRecordSummaryDto existing = getOutboxItem(user, id);
        if (!existing.isEditable()) {
            throw new IllegalArgumentException("Only unsent scheduled emails can be cancelled.");
        }
        emailRecordJdbcRepository.deleteForUser(id, user.getId());
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void dispatchDueScheduledEmails() {
        for (Long recordId : emailRecordJdbcRepository.findDueRecordIds(AppTimeZone.now())) {
            emailDispatchService.dispatchToQueue(recordId);
        }
    }

    private List<EmailRecordSummaryDto> enrichSummaries(List<EmailRecordSummaryDto> summaries) {
        summaries.forEach(this::enrichSummary);
        return summaries;
    }

    private EmailRecordSummaryDto enrichSummary(EmailRecordSummaryDto summary) {
        if (summary.getTemplateKey() != null && !summary.getTemplateKey().isBlank()) {
            summary.setTemplateDisplayName(emailTemplateService.resolveDisplayName(summary.getTemplateKey()));
        }
        return summary;
    }
}
