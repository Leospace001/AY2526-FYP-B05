package com.example.demo.dto;

import lombok.Data;

@Data
public class OrderItemResponse {

    private Long id;
    private Long orderId;
    private Long stockId;
    private String stockName;
    private int quantity;
    private double unitPrice;
    private double lineTotal;
    private String imagePath;
    private String remarks;
}
