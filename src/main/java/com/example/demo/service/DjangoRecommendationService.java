package com.example.demo.service;

import com.example.demo.dto.FlowerRecommendationRequest;
import com.example.demo.dto.FlowerRecommendationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class DjangoRecommendationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${DJANGO_API_BASE_URL:http://django-api:8000}")
    private String djangoApiBaseUrl;

    public FlowerRecommendationResponse recommendFlower(FlowerRecommendationRequest request) {
        String url = djangoApiBaseUrl + "/api/recommend/flower";
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

        if (response == null) {
            throw new IllegalStateException("Empty response from Django service");
        }

        return new FlowerRecommendationResponse(
                String.valueOf(response.getOrDefault("flower_name", "")),
                String.valueOf(response.getOrDefault("scientific_name", "")),
                String.valueOf(response.getOrDefault("recommendation_reason", "")),
                String.valueOf(response.getOrDefault("care_instructions", ""))
        );
    }
}
