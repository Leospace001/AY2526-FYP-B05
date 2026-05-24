package com.example.demo.dto;

import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class StockRequestDto {
    
    @Schema(description = "name", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;
    
    @Schema(description = "description", requiredMode = Schema.RequiredMode.REQUIRED)
    private String description;
    
    @Schema(description = "selling price", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private double sellingPrice;
    
    @Schema(description = "cost", requiredMode = Schema.RequiredMode.REQUIRED)
    private double cost;

    @Schema(description = "quantity", requiredMode = Schema.RequiredMode.REQUIRED)
    private int quantity;

    @Schema(description = "quantity", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private int minimumLevel;
    
    @Schema(description = "Image file", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private MultipartFile imageFile;

}
