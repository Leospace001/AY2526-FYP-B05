package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.JwtRequest;
import com.example.demo.model.JwtResponse;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.CustomUserDetailsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@CrossOrigin(origins = "*" ) // frontend origin
public class AuthController {

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @GetMapping("/me")
    public String hello() {
        return "Hello, User!";
    }

    @PostMapping("/login")
    public JwtResponse createToken(@RequestBody JwtRequest authRequest) throws Exception {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new Exception("Invalid username or password");
        }

        // Load user details after successful authentication
        UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.getUsername());

        // Generate token using the user's username
        String token = jwtUtil.generateToken(userDetails.getUsername());

        // Return token in response
        return new JwtResponse(token);
    }

    // Optional /register endpoint for future DB-based implementation
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody JwtRequest user) {
        // For now, just accept and say "Registered" — in real use, save user to DB
        return ResponseEntity.ok("User registered successfully (mocked)");
    }
}