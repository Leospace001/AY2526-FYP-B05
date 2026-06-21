package com.example.demo.dto;

import lombok.Data;

@Data
public class OrderRequest {
    private String name;
    private String description;
    private String remarks;
    private Long deliveryAddressId;
    private Long paymentMethodId;
}
