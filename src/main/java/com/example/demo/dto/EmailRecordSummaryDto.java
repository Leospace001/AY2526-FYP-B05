package com.example.demo.dto;

import com.example.demo.config.AppTimeZone;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmailRecordSummaryDto {
    private Long id;
    private List<String> recipients;
    private String subject;
    private String body;
    private LocalDateTime scheduledSendTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean sent;
    private boolean dispatched;
    private boolean editable;
    private List<String> attachmentPaths;
    private String senderName;
    private String createdByUsername;
    private String templateKey;
    private String templateDisplayName;
    private String timeZone = AppTimeZone.ID;
}
