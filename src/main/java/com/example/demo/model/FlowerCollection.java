package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "flower_collections")
@Getter
@Setter
public class FlowerCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "flower_name", nullable = false)
    private String flowerName;

    @Column(name = "scientific_name")
    private String scientificName;

    @Column(name = "collected_at", nullable = false)
    private OffsetDateTime collectedAt;

    @Column(name = "care_instructions_summary", columnDefinition = "text")
    private String careInstructionsSummary;
}
