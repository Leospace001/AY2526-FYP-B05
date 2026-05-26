package com.example.demo.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class EmailRequestDto {
    @ArraySchema(
        schema = @Schema(description = "Recipient(s)", requiredMode = Schema.RequiredMode.REQUIRED, defaultValue = "leospace001@gmail.com"),
        arraySchema = @Schema(example = "[\"leospace001@gmail.com\", \"220240436@stu.vtc.edu.hk\"]")
    )
    private List<String> recipients;

    @Schema(description = "Subject", requiredMode = Schema.RequiredMode.REQUIRED, defaultValue = "Testing mail")
    private String subject;

    @Schema(description = "Email body", requiredMode = Schema.RequiredMode.REQUIRED, defaultValue = "Dear all, Good moring")
    private String body;

    @Schema(description = "Email attachment(s)", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private List<MultipartFile> attachments = new ArrayList<>();

    @Schema(description = "Send date, leave it blank if wish to send immediately", requiredMode = Schema.RequiredMode.NOT_REQUIRED, defaultValue = "2026-12-27T10:15:30")
    private LocalDateTime sendTime; // For delayed delivery
}
