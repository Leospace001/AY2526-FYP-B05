package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InviteCandidateDto {
    private Long userId;
    private String username;
    private String firstname;
    private String lastname;
    private String email;
}
