package com.example.demo.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import com.example.demo.model.JwtRequest;
import com.example.demo.model.User;
import java.util.Collection;


@RestController
@RequestMapping("/api/users")
public class UserRegisterController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User save =  userService.registerUser(user);
        return ResponseEntity.ok(save);
    }

}