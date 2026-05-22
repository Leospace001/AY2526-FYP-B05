package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import org.springframework.security.core.userdetails.UserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.demo.service.UserService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

     private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailProducer emailProducer;

    @Autowired
    private UserService userService;


    @PostMapping(value="/send" , consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Email service", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<String> sendEmail(
            // @RequestPart("metadata") EmailRequestDto request,
            // @RequestPart("file") MultipartFile file,
            @Parameter(required = false) @ModelAttribute EmailRequestDto request,
           Authentication authentication) {
        // userActivityLogger.info("{} is scheduling an email", customUser.getUsername());
        // User user = userService.getUserByUsername(customUser.getUsername());
        CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
        User user = userPrincipal.getUser();
        emailProducer.sendEmailToQueue(request, user);
        

        return ResponseEntity.ok("Email scheduled successfully");
    }
}
