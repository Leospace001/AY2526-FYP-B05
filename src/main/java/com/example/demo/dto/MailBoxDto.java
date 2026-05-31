package com.example.demo.dto;

import java.util.*;
import lombok.*;

@Data
public class MailBoxDto {
    private String sender;
    private List<String> to = new ArrayList<>();
    private List<String> cc = new ArrayList<>();
    private List<String> bcc = new ArrayList<>();
    private String subject;
    private String body;
    private List<EmailAttachmentDto> attachments = new ArrayList<>();
    
}