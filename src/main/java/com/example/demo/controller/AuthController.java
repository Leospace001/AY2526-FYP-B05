package com.example.demo.controller;

import java.util.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.media.*;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.dto.UserInfo;
import com.example.demo.dto.UserRegister;
import com.example.demo.exception.UserAlreadyExistsException;
import com.example.demo.mapper.UserMapper;
import com.example.demo.model.JwtRequest;
import com.example.demo.model.JwtResponse;
import com.example.demo.model.User;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.UserService;
import com.example.demo.service.EmailProducer;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.Context;

@RestController
@CrossOrigin(origins = "*") // frontend origin
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private EmailProducer emailProducer;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Value("${DOMAIN}")
    private String domainUrl;

    @PostMapping("/api/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<?> registerUser(@RequestBody UserRegister userRegister) {
        try {
            User save = userService.registerUser(userRegister);
            UserInfo updatedUserInfo = userMapper.userToUserInfo(save);
            return ResponseEntity.ok(updatedUserInfo);

        } catch (UserAlreadyExistsException ex) {
            // 🟢 TRAP THE DUPLICATE ERROR INSTANTLY:
            // This safely returns a 409 Conflict payload before Spring Security can hijack
            // it.
            Map<String, String> errorPayload = new HashMap<>();
            errorPayload.put("error", "Conflict");
            errorPayload.put("message", ex.getMessage());
            errorPayload.put("status", "409");

            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorPayload);

        } catch (Exception ex) {
            // General safety catch for any other unexpected database or validation error
            Map<String, String> errorPayload = new HashMap<>();
            errorPayload.put("error", "Internal Server Error");
            errorPayload.put("message", ex.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorPayload);
        }

    }

    @GetMapping("/api/auth/oauth/providers")
    @Operation(summary = "List enabled OAuth login providers")
    public ResponseEntity<List<String>> getOAuthProviders() {
        List<String> providers = new ArrayList<>();
        if (clientRegistrationRepository.findByRegistrationId("google") != null) {
            providers.add("google");
        }
        if (clientRegistrationRepository.findByRegistrationId("github") != null) {
            providers.add("github");
        }
        return ResponseEntity.ok(providers);
    }

    @PostMapping("/api/login")
    @Operation(summary = "Login an existing user and return a jwt token if successful")
    public ResponseEntity<?> createToken(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Details of user account", content = @Content(mediaType = "application/json", examples = {
                    @ExampleObject(name = "Normal User", value = "{\"username\": \"testing\", \"password\": \"P@ssw0rd\"}"),
                    @ExampleObject(name = "Admin User", value = "{\"username\": \"admin\", \"password\": \"P@ssw0rd\"}")
            })) @RequestBody JwtRequest authRequest) {
        Authentication authentication;
        try {
            // Trigger authentication
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword()));
        } catch (AuthenticationException e) {
            // 🟢 TRAP EXCEPTION: Build a clear error map payload
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Unauthorized");
            errorResponse.put("message", "Invalid username or password");

            // Return 401 Unauthorized instantly with your error message
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }

        // Context registration and token issuance
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtUtil.generateToken(authentication);

        // Return a 200 OK status containing your JwtResponse instance
        return ResponseEntity.ok(new JwtResponse(token));
    }

    @PostMapping("/api/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam("email") String email) {
        Context context = new Context();
        User user = userService.findUserByEmail(email);
        if (user != null) {
            String token = UUID.randomUUID().toString();
            String tokenUrl = domainUrl + "/reset?token=" + token;
            context.setVariable("name", user.getUsername());
            context.setVariable("token", token);
            context.setVariable("domainUrl", domainUrl);
            context.setVariable("tokenUrl", tokenUrl);
            String htmlContent = templateEngine.process("email/forgotPassword", context);
            List<String> recipients = new ArrayList();
            recipients.add(email);
            EmailRequestDto request = new EmailRequestDto(
                recipients,
                "Reset password Email",
                htmlContent,
                null,
                null
            );
            userService.createPasswordResetTokenForUser(user, token);
            emailProducer.sendEmailToQueue(request, user);
        }
        return ResponseEntity.ok("If email exists, a reset link has been sent.");
    }

    @PostMapping("/api/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam("token") String token, @RequestBody String newPassword) {
        String result = userService.validatePasswordResetToken(token);
        if (!result.equals("valid")) return ResponseEntity.badRequest().body("Invalid token");
        
        User user = userService.getUserByToken(token);
        userService.changeUserPassword(user, newPassword);
        userService.invalidateToken(token);
        return ResponseEntity.ok("Password updated successfully.");
    }
}