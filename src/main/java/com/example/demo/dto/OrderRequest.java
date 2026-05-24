// src/main/java/com/example/demo/dto/OrderRequest.java
package com.example.demo.dto;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class OrderRequest {
    @Column(nullable = false, unique = false, columnDefinition = "varchar(255) default 'FUJI APPLE'")
    private String name;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'TAI MAN'")
    private String description;

    @Column(nullable = true, unique = false, columnDefinition = "varchar(255) default 'ASAP'")
    private String remarks;
}
