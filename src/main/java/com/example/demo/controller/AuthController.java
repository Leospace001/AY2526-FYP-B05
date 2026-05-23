package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.media.*;
import com.example.demo.model.JwtRequest;
import com.example.demo.model.JwtResponse;
import com.example.demo.security.JwtUtil;

@RestController
@CrossOrigin(origins = "*" ) // frontend origin
public class AuthController {


    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    @Operation(summary = "Login a existing user and return a jwt token if success")
    public JwtResponse createToken(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Details of user account",
            content = @Content(
            mediaType = "application/json",
            examples = {
                @ExampleObject(name = "Normal User", value ="{\"username\": \"testing\", \"password\": \"P@ssw0rd\"}", summary = "Default for users"),
                @ExampleObject(name = "Admin User", value ="{\"username\": \"admin\", \"password\": \"P@ssw0rd\"}", summary = "Full access for admins")
            }
        )
    ) @org.springframework.web.bind.annotation.RequestBody JwtRequest authRequest
        // @Parameter (
        //     name = "role",
        //     description = "Role of user",
        //     in = ParameterIn.QUERY,
        //     schema = @Schema(
        //         type = "string",
        //         allowableValues = {
        //             "user",
        //             "admin"
        //         }), example = "user")
        //         @RequestParam(defaultValue = "user") String role
    ) throws Exception {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new Exception("Invalid username or password");
        }

        // Load user details after successful authentication

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate token using the user's username
        String token = jwtUtil.generateToken(authentication);

        // Return token in response
        return new JwtResponse(token);
    }
}