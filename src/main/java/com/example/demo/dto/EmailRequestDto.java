package com.example.demo.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.*;

@Data
public class EmailRequestDto {
    @Schema(description = "Recipient(s)", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> recipients;

    @Schema(description = "Subject", requiredMode = Schema.RequiredMode.REQUIRED)
    private String subject;

    @Schema(description = "Email body", requiredMode = Schema.RequiredMode.REQUIRED)
    private String body;

    @Schema(description = "Email attachment(s)", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private List<MultipartFile> attachments = new ArrayList<>();

    @Schema(description = "Send date, leave it blank if wish to send immediately", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private LocalDateTime sendTime; // For delayed delivery
}
