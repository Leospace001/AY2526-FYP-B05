package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.example.demo.service.UserService;
import com.example.demo.model.User;
import com.example.demo.dto.UserInfo;
import com.example.demo.dto.UserRegister;
import com.example.demo.mapper.UserMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @PostMapping
    @Operation(summary = "Register a new user")
    public ResponseEntity<UserInfo> registerUser(@RequestBody UserRegister userRegister) {
        User save =  userService.registerUser(userRegister);
        UserInfo updatedUserInfo = userMapper.userToUserInfo(save);
        return ResponseEntity.ok(updatedUserInfo);
    }

    @GetMapping("/{username}")
    @PreAuthorize("#username == authentication.principal.username or hasRole('ADMIN')")
    @Operation(summary = "Get one user by username, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> getUserById(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        UserInfo userInfo = userMapper.userToUserInfo(user);
        return ResponseEntity.ok(userInfo);
    }

    @PutMapping("/{username}")
    @PreAuthorize("#username == authentication.principal.username or hasRole('ADMIN')")
    @Operation(summary = "Update user, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> updateUser(@PathVariable String username,@RequestBody UserInfo userInfo) {
        User user = userService.updateUser(username, userInfo);
        UserInfo updatedUserInfo = userMapper.userToUserInfo(user);
        return ResponseEntity.ok(updatedUserInfo);
    }
}