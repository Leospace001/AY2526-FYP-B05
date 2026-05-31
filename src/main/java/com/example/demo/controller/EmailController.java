package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;

import com.example.demo.dto.EmailRequestDto;
import com.example.demo.dto.MailBoxDto;
import com.example.demo.service.EmailProducer;
import com.example.demo.service.EmailService;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    @Autowired
    private EmailProducer emailProducer;

    @Autowired
    private EmailService emailService;

    @GetMapping("/inbox")
    @Operation(summary = "Email service", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<MailBoxDto>> getInbox(
            @RequestParam(defaultValue = "5") int limit) {
        
        List<MailBoxDto> emails = emailService.readInbox(limit);
        return ResponseEntity.ok(emails);
    }
    
    
    @PostMapping(value="/send" , consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Email service", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<String> sendEmail(
            @Parameter(required = false) @ModelAttribute EmailRequestDto request,
            Authentication authentication) {
        
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        
        // Producer handles DB saving and RabbitMQ queuing
        emailProducer.sendEmailToQueue(request, user);

        return ResponseEntity.ok("Email scheduled successfully");
    }
}