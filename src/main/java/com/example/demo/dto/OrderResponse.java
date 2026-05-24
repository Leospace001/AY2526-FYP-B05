// src/main/java/com/example/demo/dto/OrderRequest.java
package com.example.demo.dto;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Data;

@Data
public class OrderResponse {
    
    private Long id;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String description;

    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'FUJI APPLE'")
    private String name;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'ASAP'")
    private String remarks;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean isActive = true;
}
