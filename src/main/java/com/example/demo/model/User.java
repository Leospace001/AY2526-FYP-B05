package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "users")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String firstname;

    @Column(nullable = false, unique = true, columnDefinition = "varchar(255) default 'CHAN'")
    private String lastname;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'abc@mail.com'")
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true)
    private int age;

    @Column(nullable = true)
    private Date birthday;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isAdmin;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean isActive;
    
}