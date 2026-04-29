package com.example.demo.service;

import com.example.demo.dto.FlowerRecommendationRequest;
import com.example.demo.dto.FlowerRecommendationResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FlowerRecommendationService {
    private static final String GEMINI_ENDPOINT =
            "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${GEMINI_API_KEY:${app.gemini.api-key:}}")
    private String geminiApiKey;

    @Value("${app.gemini.use-mock:false}")
    private boolean useMockGemini;

    public FlowerRecommendationService(ObjectMapper objectMapper, RestTemplateBuilder restTemplateBuilder) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(8))
                .setReadTimeout(Duration.ofSeconds(20))
                .build();
    }

    public FlowerRecommendationResponse recommendFlower(FlowerRecommendationRequest request) {
        if (useMockGemini) {
            return buildMockRecommendation();
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return buildMockRecommendation();
        }

        String prompt = buildPrompt(request);
        Map<String, Object> payload = buildPayload(prompt);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    GEMINI_ENDPOINT + geminiApiKey,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                return buildMockRecommendation();
            }

            String geminiText = extractGeminiText(response.getBody());
            String normalizedJson = normalizeJson(geminiText);
            JsonNode recommendationNode = objectMapper.readTree(normalizedJson);

            return new FlowerRecommendationResponse(
                    recommendationNode.path("flower_name").asText(""),
                    recommendationNode.path("scientific_name").asText(""),
                    recommendationNode.path("recommendation_reason").asText(""),
                    recommendationNode.path("care_instructions").asText("")
            );
        } catch (RestClientResponseException e) {
            int status = e.getRawStatusCode();
            if (status == 400 || status == 429 || status == 503) {
                return buildMockRecommendation();
            }
            return buildMockRecommendation();
        } catch (ResourceAccessException e) {
            return buildMockRecommendation();
        } catch (Exception e) {
            return buildMockRecommendation();
        }
    }

    private String buildPrompt(FlowerRecommendationRequest request) {
        List<String> traits = request.getTraits();
        String traitsText = (traits == null || traits.isEmpty()) ? "none" : String.join(", ", traits);

        return "You are a floriculture recommendation assistant.\n"
                + "Recommend one flower based on user preferences.\n"
                + "Return JSON only without markdown, code fences, or extra text.\n"
                + "The JSON must strictly follow this schema:\n"
                + "{\n"
                + "  \"flower_name\": \"\",\n"
                + "  \"scientific_name\": \"\",\n"
                + "  \"recommendation_reason\": \"\",\n"
                + "  \"care_instructions\": \"\"\n"
                + "}\n"
                + "User preferences:\n"
                + "- species: " + safeString(request.getSpecies()) + "\n"
                + "- color: " + safeString(request.getColor()) + "\n"
                + "- usage: " + safeString(request.getUsage()) + "\n"
                + "- traits: " + traitsText + "\n";
    }

    private Map<String, Object> buildPayload(String prompt) {
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart));

        Map<String, Object> payload = new HashMap<>();
        payload.put("contents", List.of(content));
        return payload;
    }

    private String extractGeminiText(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini response has no candidates.");
        }

        JsonNode textNode = candidates.get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text");

        if (textNode == null || textNode.isMissingNode()) {
            throw new IllegalStateException("Gemini response text is missing.");
        }
        return textNode.asText();
    }

    private String normalizeJson(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "");
            trimmed = trimmed.replaceFirst("\\s*```$", "");
        }
        return trimmed.trim();
    }

    private FlowerRecommendationResponse buildMockRecommendation() {
        return new FlowerRecommendationResponse(
                "Iceberg Rose",
                "Rosa 'Iceberg'",
                "Mock mode is enabled or Gemini is unavailable, so this demo response is used to keep the UI stable.",
                "Water deeply once or twice weekly, keep in full sun, and prune lightly after flowering to encourage healthy growth.",
                true
        );
    }

    private String safeString(String value) {
        return value == null || value.isBlank() ? "unspecified" : value;
    }
}
