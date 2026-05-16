package com.example.demo.dto;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

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

    private Date birthday;
    
}