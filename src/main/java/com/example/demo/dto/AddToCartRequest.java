package com.example.demo.dto;

import lombok.Data;

@Data
public class AddToCartRequest {
    private Long stockId;
    private Integer quantity;
}
