package com.example.demo.dto;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

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

    private Date birthday;

    private boolean isAdmin;

    private boolean isActive;
    
}