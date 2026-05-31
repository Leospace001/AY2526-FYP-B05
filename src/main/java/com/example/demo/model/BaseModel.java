package com.example.demo.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Getter @Setter
@MappedSuperclass
public abstract class BaseModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String name;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String description;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String remarks;
    
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

}
