package com.example.demo.controller;

import com.example.demo.dto.FlowerRecommendationRequest;
import com.example.demo.dto.FlowerRecommendationResponse;
import com.example.demo.service.FlowerRecommendationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/recommend")
public class FlowerRecommendationController {
    private final FlowerRecommendationService flowerRecommendationService;

    public FlowerRecommendationController(FlowerRecommendationService flowerRecommendationService) {
        this.flowerRecommendationService = flowerRecommendationService;
    }

    @PostMapping("/flower")
    public ResponseEntity<?> recommendFlower(@RequestBody FlowerRecommendationRequest request) {
        try {
            FlowerRecommendationResponse recommendation = flowerRecommendationService.recommendFlower(request);
            return ResponseEntity.ok(recommendation);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            FlowerRecommendationResponse fallback = new FlowerRecommendationResponse(
                    "Iceberg Rose",
                    "Rosa 'Iceberg'",
                    "We couldn't reach Gemini right now, so this demo recommendation is shown instead to keep the experience smooth.",
                    "Water deeply once or twice weekly, keep in full sun, and prune lightly after flowering to encourage healthy growth."
            );
            return ResponseEntity.ok(fallback);
        }
    }
}
