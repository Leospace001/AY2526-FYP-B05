package com.example.demo.model;

import lombok.*;
import jakarta.persistence.*;
import java.util.*;


@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stocks")
public class Stock extends BaseModel {
        
    @Column(nullable = false, unique = false)
    private double sellingPrice;

    @Column(nullable = true, unique = false)
    private double cost;

    @Column(nullable = true, unique = false)
    private int quantity;

    @Column(nullable = true, unique = false)
    private int minimumLevel;

    @Column(nullable = true, unique = false)
    private String imagePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", nullable = true)
    private User approvedBy;

    @OneToMany(mappedBy = "stock", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Set<OrderItem> transactions = new HashSet<>();

}