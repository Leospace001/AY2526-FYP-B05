package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodRequest {
    private String label;
    private String cardholderName;
    private String cardBrand;
    private String cardNumber;
    private int expiryMonth;
    private int expiryYear;
    private Boolean isDefault;
}
