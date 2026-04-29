package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;

public class FlowerCollectionAddRequest {
    @NotBlank(message = "Flower name is required.")
    private String flowerName;

    private String scientificName;

    private String careInstructionsSummary;

    public FlowerCollectionAddRequest() {
    }

    public String getFlowerName() {
        return flowerName;
    }

    public void setFlowerName(String flowerName) {
        this.flowerName = flowerName;
    }

    public String getScientificName() {
        return scientificName;
    }

    public void setScientificName(String scientificName) {
        this.scientificName = scientificName;
    }

    public String getCareInstructionsSummary() {
        return careInstructionsSummary;
    }

    public void setCareInstructionsSummary(String careInstructionsSummary) {
        this.careInstructionsSummary = careInstructionsSummary;
    }
}
