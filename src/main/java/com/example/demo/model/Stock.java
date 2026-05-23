package com.example.demo.model;

import lombok.*;
import java.util.HashSet;
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
    private String imagePath;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by", nullable = true)
    private User approvedBy;

    @OneToMany(mappedBy = "stock", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private Set<Transaction> transactions = new HashSet<>();

}