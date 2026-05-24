package com.example.demo.dto;

import lombok.Data;

@Data
public class OrderItemResponse {
    
    private Long id;          // The OrderItem ID
    private Long orderId;     // The ID of the Order it belongs to
    private Long stockId;     // The ID of the Stock added
    private String stockName; // The name of the Stock
    private int quantity;
    private String remarks;
    
}