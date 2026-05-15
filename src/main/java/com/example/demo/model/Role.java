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

    @Column(nullable = false, unique = true, columnDefinition = "varchar(255) default 'USER'")
    private String name;

    @Column(nullable = false, unique = true, columnDefinition = "varchar(255) default 'USER'")
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToMany(mappedBy = "roles") // Matches the field name in the User entity
    private Set<User> users = new HashSet<>();

}