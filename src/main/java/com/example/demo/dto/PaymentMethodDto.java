package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodDto {
    private Long id;
    private String label;
    private String cardholderName;
    private String cardBrand;
    private String cardLastFour;
    private int expiryMonth;
    private int expiryYear;
    private boolean isDefault;
}
