package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class OrderResponse {

    private Long id;
    private String description;
    private String name;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isActive = true;

    private String customerUsername;
    private double orderTotal;
    private List<OrderItemResponse> items = new ArrayList<>();

    private Long deliveryAddressId;
    private String deliveryLabel;
    private String deliveryRecipientName;
    private String deliveryPhone;
    private String deliveryAddressLine1;
    private String deliveryAddressLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPostalCode;
    private String deliveryCountry;

    private Long paymentMethodId;
    private String paymentLabel;
    private String paymentCardholderName;
    private String paymentCardBrand;
    private String paymentCardLastFour;
    private Integer paymentExpiryMonth;
    private Integer paymentExpiryYear;
}
