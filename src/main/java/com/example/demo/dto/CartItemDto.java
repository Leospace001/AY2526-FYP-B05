package com.example.demo.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CartItemDto {
    private Long id;
    private Long stockId;
    private String productName;
    private Double sellingPrice;
    private String imagePath;
    private Integer quantity;

    /** Used by CartItemRepository JPQL projection — avoids loading full Stock entities. */
    public CartItemDto(Long id, Integer quantity, Long stockId, String productName, Double sellingPrice, String imagePath) {
        this.id = id;
        this.quantity = quantity;
        this.stockId = stockId;
        this.productName = productName;
        this.sellingPrice = sellingPrice;
        this.imagePath = imagePath;
    }
}
