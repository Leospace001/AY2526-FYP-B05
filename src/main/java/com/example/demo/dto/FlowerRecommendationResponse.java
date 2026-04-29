package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FlowerRecommendationResponse {
    @JsonProperty("flower_name")
    private String flowerName;
    @JsonProperty("scientific_name")
    private String scientificName;
    @JsonProperty("recommendation_reason")
    private String recommendationReason;
    @JsonProperty("care_instructions")
    private String careInstructions;
    @JsonProperty("demo_mode")
    private boolean demoMode;

    public FlowerRecommendationResponse() {
    }

    public FlowerRecommendationResponse(
            String flowerName,
            String scientificName,
            String recommendationReason,
            String careInstructions) {
        this(flowerName, scientificName, recommendationReason, careInstructions, false);
    }

    public FlowerRecommendationResponse(
            String flowerName,
            String scientificName,
            String recommendationReason,
            String careInstructions,
            boolean demoMode) {
        this.flowerName = flowerName;
        this.scientificName = scientificName;
        this.recommendationReason = recommendationReason;
        this.careInstructions = careInstructions;
        this.demoMode = demoMode;
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

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }

    public String getCareInstructions() {
        return careInstructions;
    }

    public void setCareInstructions(String careInstructions) {
        this.careInstructions = careInstructions;
    }

    public boolean isDemoMode() {
        return demoMode;
    }

    public void setDemoMode(boolean demoMode) {
        this.demoMode = demoMode;
    }
}
