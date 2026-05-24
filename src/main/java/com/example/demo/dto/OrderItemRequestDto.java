package com.example.demo.dto;

import lombok.Data;

@Data
public class OrderItemRequestDto {
    private Long stockId;
    private int quantity;
    private String remarks;
}
