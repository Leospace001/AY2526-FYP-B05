package com.example.demo.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.*;

@Data
public class EmailRequestDto {
    private List<String> recipients;
    private String subject;
    private String body;
    private List<MultipartFile> attachments = new ArrayList<>();
    private LocalDateTime sendTime; // For delayed delivery
}
