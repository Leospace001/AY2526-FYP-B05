package com.example.demo.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
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
public class UserRegisterController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @PostMapping
    public ResponseEntity<UserInfo> registerUser(@RequestBody UserRegister userRegister) {
        User save =  userService.registerUser(userRegister);
        UserInfo updatedUserInfo = userMapper.userToUserInfo(save);
        return ResponseEntity.ok(updatedUserInfo);
    }

    @GetMapping("/{username}")
    @PreAuthorize("#username == authentication.principal.username")
    @Operation(summary = "Get user by username", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> getUserById(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        UserInfo userInfo = userMapper.userToUserInfo(user);
        return ResponseEntity.ok(userInfo);
    }

    @PostMapping("/{username}")
    @PreAuthorize("#username == authentication.principal.username")
    @Operation(summary = "Update user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> updateUser(@PathVariable String username,@RequestBody UserInfo userInfo) {
        User user = userService.updateUser(username, userInfo);
        UserInfo updatedUserInfo = userMapper.userToUserInfo(user);
        return ResponseEntity.ok(updatedUserInfo);
    }
}