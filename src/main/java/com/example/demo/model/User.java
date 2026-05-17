package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;

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

    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String firstname;

    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'CHAN'")
    private String lastname;

    @Column(nullable = false, unique = true, updatable = false)
    private String username;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'abc@mail.com'")
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true)
    private int age;

    @Column(nullable = true)
    private LocalDateTime  birthday;

    @Column(nullable = true)
    private int phone;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isAdmin;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean isActive;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private Set<UserRoleAssignment> roleAssignments = new HashSet<>();

}