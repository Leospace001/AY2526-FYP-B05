package com.example.demo.dto;

import lombok.Data;

@Data
public class CartItemDto {
    private Long id;
    private Long stockId;
    private Double sellingPrice; // Pulled from your Stock class
    private String imagePath;    // Pulled from your Stock class
    private Integer quantity;
}
