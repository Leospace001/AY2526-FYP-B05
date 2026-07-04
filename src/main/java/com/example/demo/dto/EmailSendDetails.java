package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EmailSendDetails {
    private Long id;
    private List<String> recipients;
    private String subject;
    private String body;
    private List<String> attachmentPaths;
    private LocalDateTime scheduledSendTime;
    private boolean sent;
}
