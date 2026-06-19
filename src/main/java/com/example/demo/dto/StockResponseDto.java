package com.example.demo.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class StockResponseDto {
    private Long id;
    private String name;
    private String description;
    private double sellingPrice;
    private int quantity;
    private int minimumLevel;
    private double cost;
    private String imagePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isActive;

    
}
