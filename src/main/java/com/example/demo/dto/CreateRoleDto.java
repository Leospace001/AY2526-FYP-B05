package com.example.demo.dto;

import com.example.demo.model.ERole;

import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateRoleDto {
    private ERole name;
    private String description;
}
