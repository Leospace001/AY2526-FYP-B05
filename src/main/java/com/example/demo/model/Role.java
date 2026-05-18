package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "role")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, columnDefinition = "varchar(255) default 'ROLE_USER'")
    private ERole name;

    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'ROLE_USER'")
    private String description;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean isActive;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private Set<UserRoleAssignment> roleAssignments = new HashSet<>();

}