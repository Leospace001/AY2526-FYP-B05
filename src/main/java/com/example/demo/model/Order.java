package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Order extends BaseModel{

	@ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

	@ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

	@ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by", nullable = true)
    private User approvedBy;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private Set<OrderItem> transactions = new HashSet<>();

    @Column(nullable = true)
    private Long deliveryAddressId;

    @Column(nullable = true)
    private Long paymentMethodId;

    @Column(nullable = true, length = 100)
    private String deliveryLabel;

    @Column(nullable = true, length = 120)
    private String deliveryRecipientName;

    @Column(nullable = true, length = 32)
    private String deliveryPhone;

    @Column(nullable = true, length = 255)
    private String deliveryAddressLine1;

    @Column(nullable = true, length = 255)
    private String deliveryAddressLine2;

    @Column(nullable = true, length = 100)
    private String deliveryCity;

    @Column(nullable = true, length = 100)
    private String deliveryState;

    @Column(nullable = true, length = 32)
    private String deliveryPostalCode;

    @Column(nullable = true, length = 100)
    private String deliveryCountry;

    @Column(nullable = true, length = 100)
    private String paymentLabel;

    @Column(nullable = true, length = 120)
    private String paymentCardholderName;

    @Column(nullable = true, length = 32)
    private String paymentCardBrand;

    @Column(nullable = true, length = 4)
    private String paymentCardLastFour;

    @Column(nullable = true)
    private Integer paymentExpiryMonth;

    @Column(nullable = true)
    private Integer paymentExpiryYear;

    @Column(nullable = false, columnDefinition = "double precision default 0")
    private double orderTotal = 0;
}