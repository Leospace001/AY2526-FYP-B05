package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
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

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isAdmin;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean isActive;

    public User () {};

    public User (
        String firstname,
        String lastname,
        String username,
        String email,
        String password,
        boolean admin,
        boolean active
        ) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.username = username;
        this.email = email;
        this.password = password;
        this.isAdmin = admin;
        this.isActive = active;
    }
}