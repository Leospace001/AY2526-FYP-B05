package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserRegisterController {

    private final UserService userService;

    public UserRegisterController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody User user) {
        User savedUser = userService.registerUser(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful. You can now sign in.",
                "user", Map.of(
                        "id", savedUser.getId(),
                        "firstname", savedUser.getFirstname(),
                        "lastname", savedUser.getLastname(),
                        "username", savedUser.getUsername(),
                        "email", savedUser.getEmail()
                )
        ));
    }
}
