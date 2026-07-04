package com.example.demo.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.config.AppTimeZone;
import com.example.demo.dto.EmailRecordSummaryDto;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.dto.MailBoxDto;
import com.example.demo.dto.UpdateScheduledEmailDto;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.EmailProducer;
import com.example.demo.service.EmailRecordService;
import com.example.demo.service.EmailService;
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

    @Autowired
    private EmailRecordService emailRecordService;

    @GetMapping("/inbox")
    @Operation(summary = "Read messages from the configured IMAP inbox", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<MailBoxDto>> getInbox(
            @RequestParam(defaultValue = "50") int limit) {
        List<MailBoxDto> emails = emailService.readInbox(limit);
        return ResponseEntity.ok(emails);
    }

    @GetMapping("/sent")
    @Operation(summary = "List emails sent by the current user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<EmailRecordSummaryDto>> getSentEmails(Authentication authentication) {
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        return ResponseEntity.ok(emailRecordService.listSentByUser(user));
    }

    @GetMapping("/scheduled")
    @Operation(summary = "List scheduled emails for the current user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<EmailRecordSummaryDto>> getScheduledEmails(Authentication authentication) {
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        return ResponseEntity.ok(emailRecordService.listScheduledByUser(user));
    }

    @GetMapping("/outbox")
    @Operation(summary = "List all outgoing emails composed by the current user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<EmailRecordSummaryDto>> getOutbox(Authentication authentication) {
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        return ResponseEntity.ok(emailRecordService.listOutboxByUser(user));
    }

    @GetMapping("/outbox/{id}")
    @Operation(summary = "Get one outgoing email composed by the current user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailRecordSummaryDto> getOutboxItem(
            @PathVariable Long id,
            Authentication authentication) {
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        return ResponseEntity.ok(emailRecordService.getOutboxItem(user, id));
    }

    @PutMapping("/outbox/{id}")
    @Operation(summary = "Update a scheduled email before it is sent", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<EmailRecordSummaryDto> updateScheduledEmail(
            @PathVariable Long id,
            @RequestBody UpdateScheduledEmailDto update,
            Authentication authentication) {
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        return ResponseEntity.ok(emailRecordService.updateScheduledEmail(user, id, update));
    }

    @DeleteMapping("/outbox/{id}")
    @Operation(summary = "Cancel a scheduled email before it is sent", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> cancelScheduledEmail(
            @PathVariable Long id,
            Authentication authentication) {
        User user = ((CustomUserDetails) authentication.getPrincipal()).getUser();
        emailRecordService.cancelScheduledEmail(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Compose or schedule an email", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<String> sendEmail(
            @Parameter(required = false) @ModelAttribute EmailRequestDto request,
            Authentication authentication) {
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        emailProducer.sendEmailToQueue(request, user);

        if (request.getSendTime() != null) {
            return ResponseEntity.ok("Email scheduled successfully (" + AppTimeZone.LABEL + ")");
        }
        return ResponseEntity.ok("Email queued successfully");
    }
}
