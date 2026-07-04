package com.example.demo.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserInfo {

    private String firstname;
    
    private String lastname;

    private String username;

    private String email;

    private int age;

    private int phone;

    private boolean isActive;

    private List<String> roles = new ArrayList<>();

    /** Login methods linked to this account, e.g. password, google, github */
    private List<String> authMethods = new ArrayList<>();

    private String avatarPath;
    private String avatarUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
}