package com.example.demo.dto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UpdateScheduledEmailDto {
    private List<String> recipients;
    private String subject;
    private String body;
    private LocalDateTime sendTime;

    public void setSendTime(String sendTime) {
        if (sendTime == null || sendTime.isBlank()) {
            this.sendTime = null;
            return;
        }
        try {
            this.sendTime = LocalDateTime.parse(sendTime, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException ignored) {
            this.sendTime = LocalDateTime.parse(sendTime, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
        }
    }
}
