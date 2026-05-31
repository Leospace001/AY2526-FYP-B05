package com.example.demo.dto;

import com.example.demo.model.Role;
import com.example.demo.model.User;

import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AddMemberToRoleDto {
    private User user;

    private Role role;
    
}
