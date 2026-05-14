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
import com.example.demo.mapper.UserMapper;


@RestController
@RequestMapping("/api/users")
public class UserRegisterController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @PostMapping
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        User save =  userService.registerUser(user);
        return ResponseEntity.ok(save);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserInfo> getUserById(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        UserInfo userInfo = userMapper.userToUserInfo(user);
        return ResponseEntity.ok(userInfo);
    }
}