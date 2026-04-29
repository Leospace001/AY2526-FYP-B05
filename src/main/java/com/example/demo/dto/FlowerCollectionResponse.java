package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class FlowerCollectionResponse {
    private UUID id;
    private String flowerName;
    private String scientificName;
    private OffsetDateTime collectedAt;
    private String careInstructionsSummary;

    public FlowerCollectionResponse() {
    }

    public FlowerCollectionResponse(UUID id, String flowerName, String scientificName, OffsetDateTime collectedAt, String careInstructionsSummary) {
        this.id = id;
        this.flowerName = flowerName;
        this.scientificName = scientificName;
        this.collectedAt = collectedAt;
        this.careInstructionsSummary = careInstructionsSummary;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public OffsetDateTime getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(OffsetDateTime collectedAt) {
        this.collectedAt = collectedAt;
    }

    public String getCareInstructionsSummary() {
        return careInstructionsSummary;
    }

    public void setCareInstructionsSummary(String careInstructionsSummary) {
        this.careInstructionsSummary = careInstructionsSummary;
    }
}
