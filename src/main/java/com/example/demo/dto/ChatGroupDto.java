package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.model.GroupMemberRole;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupDto {
    private Long id;
    private String name;
    private String description;
    private String createdByUsername;
    private int memberCount;
    private GroupMemberRole myRole;
    private boolean member;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
