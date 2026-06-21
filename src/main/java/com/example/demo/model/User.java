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
public class User extends BaseModel {

    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String firstname;

    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'CHAN'")
    private String lastname;

    @Column(nullable = false, unique = true, updatable = false)
    private String username;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'abc@mail.com'")
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = true)
    private int age;

    @Column(nullable = true)
    private int phone;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private Set<UserRoleAssignment> roleAssignments = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private Set<PasswordResetToken> token = new HashSet<>();
}