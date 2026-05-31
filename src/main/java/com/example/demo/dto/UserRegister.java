package com.example.demo.dto;

import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRegister {

    private String firstname;
    
    private String lastname;

    private String username;

    private String password;

    private String email;

    private int age;

    private int phone;
    
}