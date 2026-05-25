package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import com.example.demo.service.UserService;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.dto.UserInfo;
import com.example.demo.dto.UserRegister;
import com.example.demo.mapper.UserMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

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
    
    @GetMapping()
    @Operation(summary = "Get users (Admin gets all, Normal user gets only themselves)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Page<UserInfo>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "username") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            Authentication authentication) {

        // 1. Check if the requester is an Admin
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // 🚀 ADMIN: Return the full paginated database
            Page<UserInfo> allUsers = userService.getPaginatedUsers(page, size, sortBy, sortDir);
            return ResponseEntity.ok(allUsers);
        } else {
            // 🚀 NORMAL USER: Extract their identity directly from the token
            CustomUserDetails userPrincipal = (CustomUserDetails) authentication.getPrincipal();
            User user = userService.getUserByUsername(userPrincipal.getUsername());
            UserInfo userInfo = userMapper.userToUserInfo(user);

            // Wrap their single profile into a Page format so the frontend doesn't break
            Page<UserInfo> singleUserPage = new PageImpl<>(
                Collections.singletonList(userInfo), 
                PageRequest.of(0, 1), 
                1
            );
            
            return ResponseEntity.ok(singleUserPage);
        }
    }


    @PutMapping("/{username}")
    // 🚀 THE BOUNCER: You can only enter if the URL matches your token's username, OR if you are an Admin!
    @PreAuthorize("#username == authentication.principal.username or hasRole('ADMIN')")
    @Operation(summary = "Update user, available to admin and user itself", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserInfo> updateUser(
            @PathVariable String username,
            @RequestBody UserInfo userInfo,
            Authentication authentication) { // 🚀 Inject the token data
            
        // 1. Check if the person making this request holds the ADMIN role
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // 2. Pass the username, the form data, and the admin status to the service.
        // If isAdmin is false, the service will refuse to change the account's active/inactive status!
        User user = userService.updateUser(username, userInfo, isAdmin);
        UserInfo updatedUserInfo = userMapper.userToUserInfo(user);
        
        return ResponseEntity.ok(updatedUserInfo);
    }
}