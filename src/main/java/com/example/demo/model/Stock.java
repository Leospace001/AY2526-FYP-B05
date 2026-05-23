package com.example.demo.model;

import lombok.*;
import jakarta.persistence.*;
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
    private String imagePath;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by", nullable = false)
    private User approvedBy;

}