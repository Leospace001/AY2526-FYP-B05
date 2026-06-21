package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.model.GroupMemberRole;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupMemberDto {
    private Long userId;
    private String username;
    private String firstname;
    private String lastname;
    private String email;
    private GroupMemberRole role;
    private LocalDateTime joinedAt;
}
