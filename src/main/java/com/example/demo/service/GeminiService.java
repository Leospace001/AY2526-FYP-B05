package com.example.demo.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GeminiService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String model;

    public void streamChat(String prompt, SseEmitter emitter) {
        executor.execute(() -> {
            try {
                if (apiKey == null || apiKey.isBlank()) {
                    sendError(emitter, "Gemini API key is not configured on the server.");
                    return;
                }
                if (prompt == null || prompt.isBlank()) {
                    sendError(emitter, "Message must not be empty.");
                    return;
                }

                String requestBody = objectMapper.writeValueAsString(Map.of(
                        "contents", List.of(Map.of(
                                "parts", List.of(Map.of("text", prompt))))));

                String url = String.format(
                        "https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse&key=%s",
                        model, apiKey);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpClient client = HttpClient.newHttpClient();
                HttpResponse<java.io.InputStream> response = client.send(
                        request, HttpResponse.BodyHandlers.ofInputStream());

                if (response.statusCode() >= 400) {
                    String errorBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
                    sendError(emitter, "Gemini API error (" + response.statusCode() + "): " + summarizeError(errorBody));
                    return;
                }

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.startsWith("data:")) {
                            continue;
                        }
                        String json = line.substring(5).trim();
                        if (json.isEmpty() || "[DONE]".equals(json)) {
                            continue;
                        }
                        String text = extractText(objectMapper.readTree(json));
                        if (!text.isEmpty()) {
                            emitter.send(SseEmitter.event().name("message").data(text));
                        }
                    }
                }

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception ex) {
                sendError(emitter, ex.getMessage() != null ? ex.getMessage() : "Gemini request failed.");
            }
        });
    }

    private String extractText(JsonNode root) {
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (parts.isArray() && !parts.isEmpty()) {
            return parts.get(0).path("text").asText("");
        }
        return "";
    }

    private String summarizeError(String errorBody) {
        try {
            JsonNode root = objectMapper.readTree(errorBody);
            JsonNode message = root.path("error").path("message");
            if (!message.isMissingNode()) {
                return message.asText();
            }
        } catch (Exception ignored) {
            // fall through to raw body
        }
        return errorBody.length() > 200 ? errorBody.substring(0, 200) + "..." : errorBody;
    }

    private void sendError(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().name("error").data(message));
            emitter.complete();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }
}
